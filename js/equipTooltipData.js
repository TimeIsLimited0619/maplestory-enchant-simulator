/**
 * 裝備 Tooltip 素材與排版（對照 data/UI.UIToolTip.img.xml）
 */
const EQUIP_TOOLTIP_BASE = 'images/UIToolTip';

const EQUIP_TOOLTIP_ASSETS = {
  frame: {
    nw: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Common_frame_nw.png`,
    ne: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Common_frame_ne.png`,
    sw: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Common_frame_sw.png`,
    se: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Common_frame_se.png`,
    n: `${EQUIP_TOOLTIP_BASE}/frame/frame.n.png`,
    s: `${EQUIP_TOOLTIP_BASE}/frame/frame.s.png`,
    w: `${EQUIP_TOOLTIP_BASE}/frame/frame.w.png`,
    e: `${EQUIP_TOOLTIP_BASE}/frame/frame.e.png`,
    c: `${EQUIP_TOOLTIP_BASE}/frame/frame.c.png`,
    dotline: `${EQUIP_TOOLTIP_BASE}/frame/frame.dotline.png`,
  },
  equipFrame: {
    top: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_frame_common_top.png`,
    mid: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_frame_common_mid.png`,
    btm: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_frame_common_btm.png`,
    line: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_frame_common_line.png`,
    box: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_frame_common_box.png`,
    categoryW: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_frame_common_category_w.png`,
    categoryC: `${EQUIP_TOOLTIP_BASE}/frame/frame.c.png`,
    categoryE: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_frame_common_category_e.png`,
  },
  itemIcon: {
    base: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Common_ItemIcon_base.png`,
    shade: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Common_ItemIcon_shade.png`,
  },
  textIcon: {
    starForce: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_starForce_enhanced.png`,
    scroll: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_scroll_enhanced.png`,
    hammer: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_hammer_enhanced.png`,
    bonusStat: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_bonusStat_enhanced.png`,
    potential: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_potential_normal.png`,
    additionalPotential: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_additionalPotential_normal.png`,
    soulWeapon: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_soulWeapon_normal.png`,
    exceptional: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_exceptional_enhanced.png`,
    setGuide: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_set_guide.png`,
    potentialDetail: {
      rare: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_potential_detail_rare.png`,
      epic: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_potential_detail_epic.png`,
      unique: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_potential_detail_unique.png`,
      legendary: `${EQUIP_TOOLTIP_BASE}/UIToolTip_Item_Equip_textIcon_potential_detail_legendary.png`,
    },
    bonusStatNumber(index) {
      const n = Math.max(0, Math.min(9, Math.floor(Number(index) || 0)));
      return `${EQUIP_TOOLTIP_BASE}/Equip.textIcon.bonusStat.number.${n}.png`;
    },
  },
  star: {
    filled: 'images/starforce/summaryStar.png',
    empty: 'images/starforce/summaryStar.empty.png',
  },
};

/** UIToolTip.img → Item/Equip/particle/starForce（24 星以上顯示） */
const EQUIP_TOOLTIP_STAR_EFFECT = {
  minStars: 23,
  frameDelayMs: 110,
  offset: { x: 0, y: 14 },
  anchor: { x: 160, y: 22 },
  frames: [
    `${EQUIP_TOOLTIP_BASE}/effect/starForce_0_0.png`,
    `${EQUIP_TOOLTIP_BASE}/effect/starForce_0_1.png`,
    `${EQUIP_TOOLTIP_BASE}/effect/starForce_0_2.png`,
    `${EQUIP_TOOLTIP_BASE}/effect/starForce_0_3.png`,
    `${EQUIP_TOOLTIP_BASE}/effect/starForce_0_4.png`,
    `${EQUIP_TOOLTIP_BASE}/effect/starForce_0_5.png`,
  ],
};

function shouldShowEquipTooltipStarEffect(starCount) {
  return starCount >= EQUIP_TOOLTIP_STAR_EFFECT.minStars;
}

/** UIToolTip.img → Item/Equip/space */
const EQUIP_TOOLTIP_SPACE = {
  frameMarginX: 15,
  frameMarginY: 10,
  paragraphSpace: 4,
  starSpaceY: 8,
  starBlockSpaceX: 10,
  starParagraphSpaceY: 10,
  textIconSpaceX: 4,
  categorySpaceX: 3,
  nameDescSpaceY: 5,
  /** 追加屬性兩欄之間的水平間隔（左欄起點 → 右欄起點） */
  bonusStatColSpaceX: 153,
};

/** equip 主屬 key → bonusStat.statId */
const EQUIP_BONUS_STAT_KEY_MAP = {
  str: 'str',
  dex: 'dex',
  int: 'int',
  luk: 'luk',
  hp: 'maxHp',
  mp: 'maxMp',
  atk: 'watk',
  matk: 'matk',
  def: 'def',
};

/** ARGB → CSS（#RRGGBB） */
const EQUIP_TOOLTIP_FONT = {
  itemName: '#ffffff',
  normal: '#ffffff',
  gray: '#b7bfc5',
  darkGray: '#85919f',
  trade: '#ff8a18',
  starForce: '#ffcc00',
  scroll: '#afadff',
  bonusStat: '#0ae3ad',
  exceptional: '#ff3333',
  soulWeapon: '#ffffff',
  potential: {
    rare: '#66ffff',
    epic: '#bb77ff',
    unique: '#ffcc00',
    legendary: '#ccff00',
  },
};

const EQUIP_MAIN_TYPE_LABEL = {
  [EQUIP_TYPE.WEAPON]: '武器',
  [EQUIP_TYPE.ARMOR]: '防具',
  [EQUIP_TYPE.ACCESSORY]: '飾品',
  [EQUIP_TYPE.offHandWeapon]: '輔助武器',
  [EQUIP_TYPE.Emblem]: '能源/徽章',
};

/** 僅顯示子類型標籤，不顯示主分類（飾品／防具） */
const EQUIP_SUBTYPE_HIDE_MAIN_CATEGORY = new Set(['medal', 'android', 'shoulder', 'badge', 'pocket']);

const EQUIP_SUBTYPE_LABEL = {
  weapon: '單手',
  twoHandWeapon: '雙手',
  offHandWeapon: '輔助武器',
  coat: '上衣',
  longcoat: '套服',
  cap: '帽子',
  pants: '褲/裙',
  shoes: '鞋子',
  gloves: '手套',
  cape: '披風',
  shield: '盾牌',
  ring: '戒指',
  pendant: '墜飾',
  pendant2: '墜飾',
  faceAccessory: '臉飾',
  eye: '眼飾',
  earring: '耳環',
  belt: '腰帶',
  badge: '胸章',
  emblem: '徽章',
  pocket: '口袋道具',
  shoulder: '肩榜裝飾',
  android: '機器心臟',
  hair: '髮型',
  unknown: '裝備',
  medal: '勳章',
  pin: '胸章', // 舊 subType 相容
};

const EQUIP_STAT_LABELS = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'int', label: 'INT' },
  { key: 'luk', label: 'LUK' },
  { key: 'hp', label: '最大HP' },
  { key: 'mp', label: '最大MP' },
  { key: 'atk', label: '攻擊力' },
  { key: 'matk', label: '魔法攻擊力' },
  { key: 'def', label: '防禦力' },
  { key: 'mdef', label: '魔法防禦力' },
];

/** reqJob 位元遮罩 → 顯示名稱 */
const EQUIP_REQ_JOB_LABELS = {
  1: '劍士',
  2: '法師',
  4: '弓箭手',
  8: '盜賊',
  16: '海盜',
};

const EQUIP_REQ_JOB2_LABELS = {
  31: '惡魔職業',
  42: '陰陽師',
  36: '傑諾',
  161: '蓮'
};

const EQUIP_REQ_JOB2_WEAPON_LABELS = {
  36: '能量劍',   
  42: '扇子',     
  41: '太刀', 
  161: '長劍'
};

/** reqJob2 ID → 副武器名稱對照表 */
const EQUIP_REQ_JOB2_SUBWEAPON_LABELS = {
  31: '力量之盾',
  36: '發信器',
  42: '靈符',
  41: '小太刀',
  161:'如意寶珠'
};

/** setItemID → 套組名稱（常用套裝） */
const EQUIP_SET_LABELS = {
  619: '神秘冥界套裝(弓箭手)',
  677: '漆黑BOSS套裝',
  886: '永恆套裝(劍士)',
  887: '永恆套裝(法師)',
  888: '永恆套裝(弓箭手)',
  889: '永恆套裝(盜賊)',
  890: '永恆套裝(海盜)',
  1055: '光輝BOSS套組',
};

function formatEquipReqJobs(reqJob, reqJob2 = 0) {
  // 1. 優先判斷 reqJob2：直接用 Key 尋找對應職業（不可用位元 & 運算）
  if (reqJob2 && EQUIP_REQ_JOB2_LABELS[reqJob2]) {
    return EQUIP_REQ_JOB2_LABELS[reqJob2];
  }

  // 2. 若 reqJob 與 reqJob2 皆為 0 (無限制)
  if (!reqJob) return '共用';

  // 3. 處理一般職業 reqJob (位元遮罩 Bitmask 計算)
  const jobs = [];
  Object.entries(EQUIP_REQ_JOB_LABELS).forEach(([bit, label]) => {
    if (Number(reqJob) & Number(bit)) jobs.push(label);
  });

  return jobs.length ? jobs.join('、') : '全職';
}