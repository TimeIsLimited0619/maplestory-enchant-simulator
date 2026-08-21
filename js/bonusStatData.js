/**
 * 附加能力（bonusStat）資料與洗鍊邏輯
 * 素材：images/bonusStat/、images/fullScreenbonusStat/
 */

const BONUS_STAT_IMAGE_BASE = 'images/bonusStat/';
const BONUS_STAT_FS_BASE = 'images/fullScreenbonusStat/';

function bsImg(tail) {
  return `${BONUS_STAT_IMAGE_BASE}bonusStat_${tail.replace(/[/:]/g, '_')}.png`;
}

function bsFsImg(tail) {
  return `${BONUS_STAT_FS_BASE}fullScreen_bonusStat_${tail.replace(/[/:]/g, '_')}.png`;
}

const BONUS_STAT_UI = {
  backgrnd: bsImg('backgrnd'),
  waitEquip: bsImg('layer_waitEquip'),
  summaryBox: bsImg('layer_summaryBox'),
  statBox: bsImg('layer_statBox'),
  atkPowBox: bsImg('layer_atkPowBox'),
  costMesoBox: bsImg('costMeso_layer_costMesoBox'),
  costItemBox: bsImg('costItem_layer_costItemBox'),
  costItemInvenSelected: bsImg('costItem_inven_selected'),
  costWaitHelp: bsImg('layer_costWaitHelp'),
  memorialHelp: bsImg('layer_memorialHelp'),
  notMemorialHelp: bsImg('layer_notMemorialHelp'),
  mesoIcon: bsImg('mesoTextGroup_canvas_mesoIcon'),
  costTab: {
    mesoNormal: bsImg('tab_cost_normal_0'),
    mesoSelected: bsImg('tab_cost_selected_0'),
    itemNormal: bsImg('tab_cost_normal_1'),
    itemSelected: bsImg('tab_cost_selected_1'),
  },
  confirm: {
    normal: bsImg('button_confirm_normal_0'),
    hover: bsImg('button_confirm_mouseOver_0'),
    pressed: bsImg('button_confirm_pressed_0'),
    disabled: bsImg('button_confirm_disabled_0'),
  },
  confirm1: {
    normal: bsImg('button_confirm1_normal_0'),
    hover: bsImg('button_confirm1_mouseOver_0'),
    pressed: bsImg('button_confirm1_pressed_0'),
    disabled: bsImg('button_confirm1_disabled_0'),
  },
  confirm3: {
    normal: bsImg('button_confirm3_normal_0'),
    hover: bsImg('button_confirm3_mouseOver_0'),
    pressed: bsImg('button_confirm3_pressed_0'),
    disabled: bsImg('button_confirm3_disabled_0'),
  },
  statDetail: {
    unchecked: bsImg('button_statDetail_unchecked'),
    checked: bsImg('button_statDetail_checked'),
    btnNormal: bsImg('button_statDetail_button_normal_0'),
  },
  summaryLevel(level) {
    const n = Math.max(0, Math.min(40, Math.floor(Number(level) || 0)));
    return bsImg(`summaryBox_${n}`);
  },
  summaryBoxFrame: bsImg('layer_summaryBox'),
  statIcon(index) {
    return bsImg(`statIcon_${Math.max(0, Math.min(9, index))}`);
  },
};

const BONUS_STAT_CHOICE_UI = {
  infoTop: bsFsImg('canvas_infoTop'),
  infoBtm: bsFsImg('canvas_infoBtm'),
  infoAutoBtm: bsFsImg('canvas_infoAutoBtm'),
  itemIcon: bsFsImg('canvas_itemIcon'),
  choiceBefore: bsFsImg('choiceBox_canvas_baseBefore'),
  choiceAfter: bsFsImg('choiceBox_canvas_baseAfter'),
  choiceHover: bsFsImg('choiceBox_layer_mouseOver'),
  atkOutline: bsFsImg('choiceBox_atkPow_highlight_layer_outline'),
  detailIcon(index) {
    return bsFsImg(`choiceBox_detail_icon_${Math.max(0, Math.min(9, index))}`);
  },
  progressAlert(i) {
    return bsFsImg(`progressAlert_${i}`);
  },
};

const BONUS_STAT_CHOICE_CONFIRM_BASE = 'images/fullScreenbonusStat/BS_itemConfirm_rework/';
const BONUS_STAT_CHOICE_CONFIRM_UI = {
  bg: `${BONUS_STAT_CHOICE_CONFIRM_BASE}BS_itemConfirm_layer_bg.png`,
  confirm: {
    normal: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_button_Confirm_normal_0.png`,
    mouseOver: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_button_Confirm_mouseOver_0.png`,
    pressed: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_button_Confirm_pressed_0.png`,
    disabled: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_button_Confirm_disabled_0.png`,
  },
  autoEnchantConfirm: {
    normal: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Confirm_normal_0.png`,
    mouseOver: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Confirm_mouseOver_0.png`,
    pressed: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Confirm_pressed_0.png`,
    disabled: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Confirm_disabled_0.png`,
  },
  autoEnchantCancel: {
    normal: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Cancel_confirm_normal_0.png`,
    mouseOver: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Cancel_confirm_mouseOver_0.png`,
    pressed: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Cancel_confirm_pressed_0.png`,
    disabled: `${BONUS_STAT_CHOICE_CONFIRM_BASE}bonusStat_confirmBox_AutoEnchantbutton_Cancel_confirm_disabled_0.png`,
  },
};

/** 附加能力詞條類型（顯示用；前方數字 icon 見 getBonusStatLineIconIndex） */
const BONUS_STAT_TYPES = [
  { id: 'str', iconIndex: 0, label: 'STR', isPercent: false },
  { id: 'dex', iconIndex: 1, label: 'DEX', isPercent: false },
  { id: 'int', iconIndex: 2, label: 'INT', isPercent: false },
  { id: 'luk', iconIndex: 3, label: 'LUK', isPercent: false },
  { id: 'maxHp', iconIndex: 4, label: 'MaxHP', isPercent: false },
  { id: 'maxMp', iconIndex: 5, label: 'MaxMP', isPercent: false },
  { id: 'watk', iconIndex: 6, label: '物理攻擊力', isPercent: false },
  { id: 'matk', iconIndex: 7, label: '魔法攻擊力', isPercent: false },
  { id: 'allStat', iconIndex: 8, label: '全屬性', isPercent: true },
  { id: 'bossDmg', iconIndex: 9, label: 'BOSS怪物傷害', isPercent: true },
  { id: 'def', iconIndex: 0, label: '防禦力', isPercent: false },
  { id: 'speed', iconIndex: 0, label: '移動速度', isPercent: false },
  { id: 'jump', iconIndex: 0, label: '跳躍力', isPercent: false },
  { id: 'dmg', iconIndex: 9, label: '傷害', isPercent: true },
  { id: 'levelReduce', iconIndex: 0, label: '穿戴等級減少', isPercent: false },
  { id: 'watkPct', iconIndex: 6, label: '物理攻擊力', isPercent: true },
  { id: 'matkPct', iconIndex: 7, label: '魔法攻擊力', isPercent: true },
];

const BONUS_STAT_TYPE_BY_ID = Object.fromEntries(
  BONUS_STAT_TYPES.map((t) => [t.id, t])
);

/** 詳細資料模式：屬性加總顯示順序 */
const BONUS_STAT_DETAIL_ORDER = [
  'str', 'dex', 'int', 'luk',
  'maxHp', 'maxMp',
  'watk', 'matk', 'watkPct', 'matkPct',
  'def',
  'speed', 'jump',
  'allStat', 'bossDmg', 'dmg',
  'levelReduce',
];

const BONUS_STAT_DETAIL_MAIN_IDS = new Set(['str', 'dex', 'int', 'luk']);

const BONUS_STAT_AWAKE_IMAGE_DIR = 'images/bonusStat/awakedata';

const BONUS_STAT_ITEMS = [
  {
    id: 'randomReset',
    name: '覺醒的輪迴星火',
    slotIndex: 0,
    icon: `${BONUS_STAT_AWAKE_IMAGE_DIR}/awake.png`,
    iconWidth: 32,
    iconHeight: 32,
    memorial: false,
    starFireType: 'awakened',
    helpImage: BONUS_STAT_UI.notMemorialHelp,
    tooltipImage: `${BONUS_STAT_AWAKE_IMAGE_DIR}/awake_data.png`,
  },
  {
    id: 'memorialReset',
    name: '覺醒的暗黑輪迴星火',
    slotIndex: 1,
    icon: `${BONUS_STAT_AWAKE_IMAGE_DIR}/awake_black.png`,
    iconWidth: 32,
    iconHeight: 32,
    memorial: true,
    starFireType: 'blackAwakened',
    helpImage: BONUS_STAT_UI.memorialHelp,
    tooltipImage: `${BONUS_STAT_AWAKE_IMAGE_DIR}/awake_black_data.png`,
    tripleReset: true,
  },
  {
    id: 'eternalFlame',
    name: '永遠的輪迴星火',
    slotIndex: 2,
    icon: `${BONUS_STAT_AWAKE_IMAGE_DIR}/02048769.info.icon.png`,
    iconWidth: 32,
    iconHeight: 32,
    memorial: false,
    starFireType: 'eternal',
    helpImage: BONUS_STAT_UI.notMemorialHelp,
    tooltipImage: `${BONUS_STAT_AWAKE_IMAGE_DIR}/2048769.png`,
  },
  {
    id: 'powerfulFlame',
    name: '強力的輪迴星火',
    slotIndex: 3,
    icon: `${BONUS_STAT_AWAKE_IMAGE_DIR}/02048770.info.icon.png`,
    iconWidth: 32,
    iconHeight: 32,
    memorial: false,
    starFireType: 'enhanced',
    helpImage: BONUS_STAT_UI.notMemorialHelp,
    tooltipImage: `${BONUS_STAT_AWAKE_IMAGE_DIR}/2048770.png`,
  },
];

/** 手動微調偏移（相對 XML / 現有基準；左/上為負值、下為正 yOffset） */
const BONUS_STAT_LAYOUT = {
  mesoText: { x: -2, y: -9 },
  itemGrid: { x: 11, y: 26 },
  itemIcon: { x: -3, y: 0 },
  /**
   * 道具格選中框（bonusStat_costItem_inven_selected）
   * x/y：相對格子左上角，左/上為負（可超出格子，不會被裁切）
   * width/height：數字=px；'auto'=使用 nativeWidth/nativeHeight
   * nativeWidth/nativeHeight：素材原始像素尺寸
   */
  itemSlotSelected: {
    x: -2,
    y: -1,
    width: 40,
    height: 40,
    nativeWidth: 40,
    nativeHeight: 40,
  },
  // bottomArea top 345 + 原 help top 24 = 369，再下移 78 + 44
  help: { x: 115, y: 369, yOffset: 122 },
  helpMemorial: { x: 89 },
  /** 詞條列表（#bsStatList）相對 statBox 內距的額外偏移 */
  statList: { x: 38, y: 19 },
  /** 詳細資訊切換（相對 wrap 內預設位置；左/上為負值） */
  statDetail: {
    toggle: { x: -1, y: -2 },
    label: { x: 29, y: -2 },
  },
  /** summaryBox_N 等級圖相對置中位置的偏移 */
  summaryLevel: { x: 12, y: 0 },
  /** BEFORE/AFTER 選擇框內詞條列（相對 xml 基準 27,75） */
  choiceLines: { x: 32, y: -8 },
  /** BEFORE/AFTER 詞條等級總和（相對詞條列上方） */
  choiceLevel: { x: 62, y: -19 },
  /** BEFORE/AFTER 合計數值區（xml sumLT 43,205；再左移 23） */
  choiceSum: { x: 20, y: 0 },
};

const DEFAULT_BONUS_STAT_ITEM_COUNT = 999;

const playerBonusStatItemCounts = {
  randomReset: DEFAULT_BONUS_STAT_ITEM_COUNT,
  memorialReset: DEFAULT_BONUS_STAT_ITEM_COUNT,
  eternalFlame: DEFAULT_BONUS_STAT_ITEM_COUNT,
  powerfulFlame: DEFAULT_BONUS_STAT_ITEM_COUNT,
};

function getBonusStatItemById(id) {
  return BONUS_STAT_ITEMS.find((item) => item.id === id) || null;
}

/** 記念星火（awake_black）才顯示 BEFORE/AFTER 選擇窗 */
function bonusStatShouldShowChoiceOverlay(costTab, selectedItem, mode = 'normal') {
  if (mode === 'triple') return Boolean(selectedItem?.tripleReset);
  if (costTab !== 'item' || !selectedItem) return false;
  return Boolean(selectedItem.memorial);
}

function getBonusStatRollStarFireType(costTab, selectedItem, currentState) {
  if (costTab === 'item' && selectedItem?.starFireType) {
    return selectedItem.starFireType;
  }
  return currentState?.starFireType || 'enhanced';
}

function getBonusStatItemBySlot(slotIndex) {
  return BONUS_STAT_ITEMS.find((item) => item.slotIndex === slotIndex) || null;
}

function getBonusStatItemTooltipPath(item) {
  if (!item?.tooltipImage) return null;
  return item.tooltipImage;
}

function getPlayerBonusStatItemCount(itemId) {
  if (playerBonusStatItemCounts[itemId] == null) {
    playerBonusStatItemCounts[itemId] = DEFAULT_BONUS_STAT_ITEM_COUNT;
  }
  return playerBonusStatItemCounts[itemId];
}

function consumePlayerBonusStatItem(itemId, amount = 1) {
  let count = getPlayerBonusStatItemCount(itemId);
  count = Math.max(0, count - amount);
  if (count === 0) {
    count = DEFAULT_BONUS_STAT_ITEM_COUNT;
  }
  playerBonusStatItemCounts[itemId] = count;
  return true;
}

function getDefaultBonusStatState() {
  return { level: 0, starFireLevel: 0, starFireType: 'enhanced', lines: [], atkPow: 0 };
}

/** 像素素材：整數尺寸，避免非整數縮放造成模糊 */
function bsApplyPixelImage(img, width, height) {
  if (!img) return;
  const w = Math.round(Number(width) || 0);
  const h = Math.round(Number(height) || 0);
  if (w > 0) img.style.width = `${w}px`;
  if (h > 0) img.style.height = `${h}px`;
}

function bsGetBonusStatPanelWidth(fallback = 418) {
  const panel = document.getElementById('bsActivePanel')
    || document.getElementById('panel-bonusStat');
  return Math.round(panel?.clientWidth || fallback);
}

/** 強化動畫開關（預設開啟；動畫邏輯後續接入） */
function isBonusStatEnhanceAnimEnabled() {
  const el = document.getElementById('chkBonusStatAnim');
  return el ? el.checked : true;
}

/** 詞條星火階加總 → summaryBox 素材索引（0–40） */
function calcBonusStatStarTierSum(lines = []) {
  return (lines || []).reduce(
    (sum, line) => sum + Math.max(0, Math.floor(Number(line?.starTier) || 0)),
    0
  );
}

function getBonusStatSummaryBoxLevel(state) {
  const sum = calcBonusStatStarTierSum(state?.lines);
  return Math.max(0, Math.min(40, sum));
}

/** 楓幣消耗用等級刻度（舊版 starFireLevel 2–5 對照，非 summaryBox 顯示） */
function bonusStatSummaryLevelFromStarFire(starFireLevel) {
  const sf = Math.max(2, Math.min(5, Math.floor(Number(starFireLevel) || 2)));
  return Math.min(40, (sf - 2) * 10);
}

function getBonusStatMesoCost(_level) {
  return 10000000;
}

function formatBonusStatValue(line, equip = null) {
  if (!line) return '';
  const eq = equip ?? (typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null);
  const type = BONUS_STAT_TYPE_BY_ID[line.statId];
  if (eq && isBonusStatWeaponAtkPercentLine(line, eq)) {
    return `+${bonusStatLineEffectiveValue(line, eq)}`;
  }
  const isPercent = line.isPercent ?? type?.isPercent;
  const v = line.value ?? '';
  if (isPercent) return `+${v}%`;
  if (line.statId === 'levelReduce') return String(v);
  return `+${v}`;
}

function getBonusStatEquipBaseAtk(equip) {
  return Math.max(0, Math.floor(Number(equip?.baseStats?.atk) || 0));
}

function getBonusStatEquipBaseMatk(equip) {
  return Math.max(0, Math.floor(Number(equip?.baseStats?.matk) || 0));
}

/** 武器％詞條換算用的基礎攻：物攻%→atk，魔攻%→matk */
function getBonusStatEquipBaseForPercentLine(line, equip) {
  const statId = line?.statId;
  if (statId === 'matk' || statId === 'matkPct') {
    return getBonusStatEquipBaseMatk(equip);
  }
  return getBonusStatEquipBaseAtk(equip);
}

function isBonusStatWeaponAtkPercentLine(line, equip) {
  if (!line || !equip || typeof bsIsWeaponItem !== 'function' || !bsIsWeaponItem(equip)) {
    return false;
  }
  if (line.dual?.length) return false;
  const statId = line.statId;
  if (statId !== 'watk' && statId !== 'matk' && statId !== 'watkPct' && statId !== 'matkPct') {
    return false;
  }
  const type = BONUS_STAT_TYPE_BY_ID[statId];
  const isPercent = line.isPercent ?? type?.isPercent;
  return Boolean(isPercent);
}

function bonusStatLineEffectiveValue(line, equip = null) {
  if (!line) return 0;
  const eq = equip ?? (typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null);
  const v = Number(line.value) || 0;
  if (eq && isBonusStatWeaponAtkPercentLine(line, eq)) {
    return Math.round(getBonusStatEquipBaseForPercentLine(line, eq) * v / 100);
  }
  return v;
}

function getBonusStatStatTotal(lines, statId, equip = null) {
  const eq = equip ?? (typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null);
  let total = 0;
  (lines || []).forEach((line) => {
    if (line?.dual?.length) {
      if (line.dual.includes(statId)) total += Number(line.value) || 0;
      return;
    }
    if (line.statId === statId) {
      total += bonusStatLineEffectiveValue(line, eq);
    }
  });
  return total;
}

/** 目標是否達成（詞條階級模式）：存在該詞條且星火階級 ≥ minTier（1~9） */
function bonusStatTargetMetByTier(state, statId, minTier) {
  if (!statId) return false;
  const min = Math.max(0, Math.min(BONUS_STAT_STAR_LINE_TIERS || 9, Math.floor(Number(minTier) || 0)));
  if (min <= 0) return false;
  return (state?.lines || []).some((line) => {
    if (line?.statId !== statId) return false;
    const tier = Math.floor(Number(line?.starTier) || 0);
    return tier >= min;
  });
}

/** 目標是否達成（屬性總和模式）：該屬性數值總和 ≥ minValue */
function bonusStatTargetMetByValue(state, statId, minValue, equip = null) {
  if (!statId) return false;
  const min = Number(minValue) || 0;
  if (min <= 0) return false;
  const eq = equip ?? (typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null);
  return getBonusStatStatTotal(state?.lines || [], statId, eq) >= min;
}

/** @deprecated 預設走階級模式；請改用 bonusStatTargetMetByTier / ByValue */
function bonusStatTargetMet(state, statId, minTier, _equip = null) {
  return bonusStatTargetMetByTier(state, statId, minTier);
}

function formatBonusStatLineDisplay(line, equip = null) {
  const eq = equip ?? (typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null);
  const iconIndex = getBonusStatLineIconIndex(line);

  if (line?.dual?.length) {
    const label = line.label || line.dual.map((id) => id.toUpperCase()).join('+');
    const value = line.statId === 'levelReduce'
      ? String(line.value)
      : `+${line.value}`;
    return {
      label,
      value,
      iconIndex,
    };
  }

  const type = BONUS_STAT_TYPE_BY_ID[line?.statId];
  let label = line?.label || type?.label || line?.statId || '-';
  // 星火 BOSS 傷害正名：攻擊BOSS怪物時傷害 → BOSS怪物傷害
  if (
    line?.statId === 'bossDmg'
    || label === '攻擊BOSS怪物時傷害'
    || label === '攻擊BOSS怪物時傷害%'
    || label === 'BOSS傷害'
  ) {
    label = type?.label || 'BOSS怪物傷害';
  }

  if (eq && isBonusStatWeaponAtkPercentLine(line, eq)) {
    return {
      label,
      value: `+${bonusStatLineEffectiveValue(line, eq)}`,
      iconIndex,
    };
  }

  const isPercent = line?.isPercent ?? type?.isPercent;
  const value = line
    ? (isPercent ? `+${line.value}%` : (line.statId === 'levelReduce' ? String(line.value) : `+${line.value}`))
    : '';
  return {
    label,
    value,
    iconIndex,
  };
}

/** statIcon 0–9 對應詞條星火階（1→1 … 9→9） */
function getBonusStatLineIconIndex(line) {
  const tier = Math.floor(Number(line?.starTier) || 1);
  return Math.max(0, Math.min(9, tier));
}

function aggregateBonusStatLines(lines = [], equip = null) {
  const eq = equip ?? (typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null);
  const totals = new Map();

  const addStat = (statId, value, isPercent, label) => {
    if (!statId) return;
    const v = Number(value);
    if (!Number.isFinite(v) || v === 0) return;

    const type = BONUS_STAT_TYPE_BY_ID[statId];
    const entry = totals.get(statId);
    if (entry) {
      entry.value += v;
      return;
    }

    totals.set(statId, {
      statId,
      value: v,
      isPercent: Boolean(isPercent ?? type?.isPercent),
      label: label || type?.label || statId,
    });
  };

  lines.forEach((line) => {
    if (line?.dual?.length) {
      line.dual.forEach((statId) => {
        addStat(statId, line.value, false, statId.toUpperCase());
      });
      return;
    }

    const type = BONUS_STAT_TYPE_BY_ID[line.statId];
    let value = line.value;
    let isPercent = line.isPercent ?? type?.isPercent;
    if (eq && isBonusStatWeaponAtkPercentLine(line, eq)) {
      value = bonusStatLineEffectiveValue(line, eq);
      isPercent = false;
    }
    addStat(
      line.statId,
      value,
      isPercent,
      line.label || type?.label
    );
  });

  return BONUS_STAT_DETAIL_ORDER
    .filter((statId) => totals.has(statId))
    .map((statId) => totals.get(statId));
}

function formatAggregatedBonusStatValue(row) {
  if (!row) return '';
  const v = Number(row.value) || 0;
  if (row.isPercent) return `+${v}%`;
  if (row.statId === 'levelReduce') return String(v);
  return v > 0 ? `+${v}` : String(v);
}

function calcBonusStatAtkPow(lines = []) {
  let pow = 0;
  lines.forEach((line) => {
    if (line?.dual?.length) {
      const v = Number(line.value) || 0;
      pow += v * line.dual.length;
      return;
    }

    const type = BONUS_STAT_TYPE_BY_ID[line.statId];
    if (!type && !line.isPercent) return;
    const v = Number(line.value) || 0;
    const isPercent = line.isPercent ?? type?.isPercent;
    if (isPercent) {
      pow += v * 8;
    } else if (line.statId === 'watk' || line.statId === 'matk' || line.statId === 'watkPct' || line.statId === 'matkPct') {
      pow += v * 3;
    } else if (line.statId === 'maxHp' || line.statId === 'maxMp') {
      pow += Math.floor(v / 50);
    } else {
      pow += v;
    }
  });
  return Math.round(pow);
}

function rollBonusStatState(current = getDefaultBonusStatState(), options = {}) {
  const equip = options.equip || options.item;
  const consumable = options.consumable || null;
  if (!equip || typeof bsRollBonusStatLines !== 'function') {
    return cloneBonusStatState(current);
  }

  const starFireType = options.starFireType
    || consumable?.starFireType
    || equip.starFireType
    || current.starFireType
    || 'enhanced';
  const rolled = bsRollBonusStatLines(equip, starFireType);
  const level = bonusStatSummaryLevelFromStarFire(rolled.starFireLevel);
  const lines = rolled.lines || [];

  return {
    level,
    starFireLevel: rolled.starFireLevel,
    starFireType: rolled.starFireType || starFireType,
    lines,
    atkPow: calcBonusStatAtkPow(lines),
  };
}

function cloneBonusStatState(state) {
  if (!state) return getDefaultBonusStatState();
  return {
    level: state.level ?? 0,
    starFireLevel: state.starFireLevel ?? 0,
    starFireType: state.starFireType || 'enhanced',
    lines: (state.lines || []).map((line) => ({ ...line })),
    atkPow: state.atkPow ?? 0,
  };
}

function bonusStatLineMatchesTarget(line, statId, minTier, _equip = null) {
  if (!statId || !line) return false;
  const min = Math.max(0, Math.min(BONUS_STAT_STAR_LINE_TIERS || 9, Math.floor(Number(minTier) || 0)));
  if (min <= 0) return false;
  if (line.statId !== statId) return false;
  return Math.floor(Number(line.starTier) || 0) >= min;
}

/**
 * @param {'tier'|'value'} [mode='tier'] tier=詞條階級；value=屬性數值總和
 */
function bonusStatMatchesTargets(state, targets, equip = null, mode = 'tier') {
  if (!targets?.length) return false;
  const eq = equip ?? (typeof BonusStatModule !== 'undefined' ? BonusStatModule.itemData : null);
  const useTier = mode !== 'value';

  const active = targets.filter((t) => {
    if (!t?.statId) return false;
    if (useTier) return (Number(t.minTier) || 0) > 0;
    return (Number(t.minValue) || 0) > 0;
  });
  if (!active.length) return false;

  return active.every((target) => {
    if (useTier) {
      return bonusStatTargetMetByTier(state, target.statId, target.minTier);
    }
    return bonusStatTargetMetByValue(state, target.statId, target.minValue, eq);
  });
}

function formatBonusStatAtkPow(delta) {
  const n = Math.round(Number(delta) || 0);
  let text = '-';
  if (n > 0) text = `+${n.toLocaleString()}`;
  else if (n < 0) text = n.toLocaleString();
  return typeof maybeAtkPowEasterEgg === 'function'
    ? maybeAtkPowEasterEgg(text, n)
    : text;
}
