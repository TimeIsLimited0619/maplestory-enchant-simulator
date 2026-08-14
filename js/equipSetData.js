/**
 * 套裝效果提示框資料（光輝／漆黑／永恆）
 * 永恆 886–890 共用「永恆套組」，清單去職業名。
 */

const ETERNAL_SET_IDS = [886, 887, 888, 889, 890];

const ETERNAL_HATS = ['01005980', '01005981', '01005982', '01005983', '01005984'];
const ETERNAL_COATS = ['01042433', '01042434', '01042435', '01042436', '01042437'];
const ETERNAL_PANTS = ['01062285', '01062286', '01062287', '01062288', '01062289'];
const ETERNAL_SHOULDERS = ['01152212', '01152213', '01152214', '01152215', '01152216'];
const ETERNAL_GLOVES = ['01082760', '01082761', '01082762', '01082763', '01082764'];
const ETERNAL_SHOES = ['01073629', '01073630', '01073631', '01073632', '01073633'];
const ETERNAL_CAPES = ['01103433', '01103434', '01103435', '01103436', '01103437'];

/** 永恆套組武器：名稱含創世／命運，且為武器部位（含神之子 Wpsi） */
function isEternalSetWeaponCandidate(row) {
  const name = String(row?.name || row?.item?.name || '');
  if (!name.includes('創世') && !name.includes('命運')) return false;
  const item = row?.item;
  if (!item) return false;
  if (typeof EQUIP_TYPE !== 'undefined' && item.mainType === EQUIP_TYPE.WEAPON) return true;
  const islot = item.islot || '';
  return islot === 'Wp' || islot === 'Wpsi' || islot === 'Gw' || islot === 'Op';
}

const BLACK_SPELLBOOKS = ['01162080', '01162081', '01162082', '01162083'];
const BLACK_MITRA = ['01190566', '01190567', '01190568', '01190569', '01190570'];
const BLACK_HEARTS = ['01672101'];

const EQUIP_SET_DEFS = {
  1055: {
    id: 1055,
    name: '光輝Boss套裝',
    pieces: [
      { slot: '戒指', name: '根源的耳語', itemIds: ['01113341'] },
      { slot: '墜飾', name: '死亡之誓', itemIds: ['01122447'] },
      { slot: '勳章', name: '不朽的遺產', itemIds: ['01143471'] },
      { slot: '戒指', name: '恍惚的惡夢', itemIds: ['01113360'] },
      { slot: '臉飾', name: '傲慢的原罪', itemIds: ['01012911'] },
    ],
    effects: {
      2: ['全屬性 +20, 最大HP +500', '攻擊力/魔力 +20', '攻擊Boss怪物時傷害 +15%'],
      3: ['全屬性 +20, 最大HP +500', '攻擊力/魔力 +20', '無視怪物防禦率 +15%'],
      4: ['全屬性 +20, 最大HP +500', '攻擊力/魔力 +20', '爆擊傷害 +5%'],
      5: ['全屬性 +20, 最大HP +500', '攻擊力/魔力 +20', '攻擊Boss怪物時傷害 +15%'],
    },
  },
  677: {
    id: 677,
    name: '漆黑BOSS套裝',
    pieces: [
      { slot: '臉飾', name: '口紅控制器標誌', itemIds: ['01012632'] },
      { slot: '眼飾', name: '附有魔力的眼罩', itemIds: ['01022278'] },
      { slot: '腰帶', name: '夢幻的腰帶', itemIds: ['01132308'] },
      { slot: '墜飾', name: '苦痛的根源', itemIds: ['01122430'] },
      { slot: '胸章', name: '創世的胸章', itemIds: ['01182285'] },
      { slot: '耳環', name: '指揮官力量耳環', itemIds: ['01032316'] },
      { slot: '戒指', name: '巨大的恐怖', itemIds: ['01113306'] },
      { slot: '口袋道具', name: '被詛咒的魔導書中擇1', itemIds: BLACK_SPELLBOOKS, chooseOne: true },
      { slot: '徽章', name: '在米特拉的憤怒中選1', itemIds: BLACK_MITRA, chooseOne: true },
      { slot: '機器心臟', name: '黑心', itemIds: [], group: 'heart', chooseOne: true },
      { slot: '機器心臟', name: '全面控制核心', itemIds: BLACK_HEARTS, group: 'heart', chooseOne: true },
    ],
    effects: {
      2: ['全屬性 +10, 最大HP +250', '攻擊力/魔力 +10', '攻擊Boss怪物時傷害 +10%'],
      3: ['全屬性 +10, 最大HP +250', '攻擊力/魔力 +10', '防禦力 +250', '無視怪物防禦率 +10%'],
      4: ['全屬性 +15, 最大HP +375', '攻擊力/魔力 +15', '爆擊傷害 +5%'],
      5: ['全屬性 +15, 最大HP +375', '攻擊力/魔力 +15', '攻擊Boss怪物時傷害 +10%'],
      6: ['全屬性 +15, 最大HP +375', '攻擊力/魔力 +15', '無視怪物防禦率 +10%'],
      7: ['全屬性 +15, 最大HP +375', '攻擊力/魔力 +15', '爆擊傷害 +5%'],
      8: ['全屬性 +15, 最大HP +375', '攻擊力/魔力 +15', '攻擊Boss怪物時傷害 +10%'],
      9: ['全屬性 +15, 最大HP +375', '攻擊力/魔力 +15', '爆擊傷害 +5%'],
      10: ['全屬性 +20, 最大HP +500', '攻擊力/魔力 +20', '攻擊Boss怪物時傷害 +10%'],
    },
  },
  eternal: {
    id: 'eternal',
    name: '永恆套組',
    setIds: ETERNAL_SET_IDS,
    pieces: [
      { slot: '帽子', name: '永恆頭盔', itemIds: ETERNAL_HATS },
      { slot: '上衣', name: '永恆鎧甲', itemIds: ETERNAL_COATS },
      { slot: '褲/裙', name: '永恆褲', itemIds: ETERNAL_PANTS },
      { slot: '肩膀裝飾', name: '永恆肩膀', itemIds: ETERNAL_SHOULDERS },
      { slot: '武器', name: '可選擇創世或命運武器其一', match: 'eternalWeapon', chooseOne: true },
      { slot: '手套', name: '永恆手套', itemIds: ETERNAL_GLOVES },
      { slot: '鞋子', name: '永恆鞋', itemIds: ETERNAL_SHOES },
      { slot: '披風', name: '永恆斗篷', itemIds: ETERNAL_CAPES },
    ],
    effects: {
      2: ['最大 HP/最大 MP +2500', '攻擊力/魔力 +40', '攻擊Boss怪物時傷害 +10%'],
      3: ['全屬性 +50', '攻擊力/魔力 +40', '防禦力 +600', '攻擊Boss怪物時傷害 +10%'],
      4: ['最大 HP/最大 MP +15%', '攻擊力/魔力 +40', '攻擊Boss怪物時傷害 +10%'],
      5: ['攻擊力/魔力 +40', '無視怪物防禦率 +20%'],
      6: ['攻擊力/魔力 +40', '攻擊Boss怪物時傷害 +15%'],
      7: ['全屬性 +50, 最大 HP/最大 MP +2500', '攻擊力/魔力 +40', '攻擊Boss怪物時傷害 +15%'],
      8: ['攻擊力/魔力 +40', '攻擊Boss怪物時傷害 +15%'],
    },
  },
};

function getEquipSetDef(setItemId) {
  const id = Number(setItemId) || 0;
  if (!id) return null;
  if (ETERNAL_SET_IDS.includes(id)) return EQUIP_SET_DEFS.eternal;
  return EQUIP_SET_DEFS[id] || null;
}

function getWornEquipEntries() {
  if (typeof UiEquipModule === 'undefined' || typeof UiEquipModule.getActiveWearEntries !== 'function') {
    return [];
  }
  return (UiEquipModule.getActiveWearEntries() || []).filter((entry) => entry?.itemId);
}

function resolveWornItem(entry) {
  if (!entry?.itemId) return null;
  if (typeof EquipTooltipModule !== 'undefined' && typeof EquipTooltipModule.resolveItemState === 'function') {
    return EquipTooltipModule.resolveItemState(
      entry.itemId,
      `body:${entry.slotId}`,
      entry.state,
    );
  }
  return typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[entry.itemId] : null;
}

function findWornForIds(wornList, itemIds) {
  const idSet = new Set((itemIds || []).map(String));
  if (!idSet.size) return null;
  return wornList.find((row) => idSet.has(String(row.itemId))) || null;
}

function findWornForPiece(wornList, piece) {
  if (!piece) return null;
  if (piece.match === 'eternalWeapon') {
    return wornList.find((row) => isEternalSetWeaponCandidate(row)) || null;
  }
  if (typeof piece.match === 'function') {
    return wornList.find((row) => piece.match(row)) || null;
  }
  return findWornForIds(wornList, piece.itemIds);
}

function wornListFromEntries(entries) {
  return (entries || getWornEquipEntries()).map((entry) => {
    const item = resolveWornItem(entry);
    return {
      itemId: String(entry.itemId),
      name: item?.name || entry.itemId,
      joker: !!(item?.wz?.jokerToSetItem),
      setId: Number(item?.wz?.setItemID) || 0,
      item,
    };
  });
}

function snapshotSetFromWornList(def, wornList) {
  const groupFilled = Object.create(null);
  const rows = def.pieces.map((piece, index) => {
    const worn = findWornForPiece(wornList, piece);
    const group = piece.group || `p${index}`;
    if (worn) groupFilled[group] = true;
    const lucky = !!(worn?.joker);
    const wornName = worn ? worn.name : '';
    let luckyKind = null;
    if (lucky) {
      luckyKind = String(wornName).includes('創世') ? 'genesis' : 'destiny';
    }
    return {
      slot: piece.slot,
      name: piece.name,
      chooseOne: !!piece.chooseOne,
      group,
      equipped: !!worn,
      lucky,
      luckyKind,
      displayName: worn ? worn.name : piece.name,
    };
  });

  const groups = [];
  rows.forEach((row) => {
    if (!groups.includes(row.group)) groups.push(row.group);
  });
  const wornCount = groups.filter((g) => groupFilled[g]).length;
  const total = groups.length;

  return {
    def,
    name: def.name,
    wornCount,
    total,
    rows,
    effects: Object.keys(def.effects)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => ({
        count: n,
        lines: def.effects[n],
        active: wornCount >= n,
      })),
  };
}

function getEquipSetSnapshot(setItemId, entries) {
  const def = getEquipSetDef(setItemId);
  if (!def) return null;
  return snapshotSetFromWornList(def, wornListFromEntries(entries));
}

const SET_STAT_LABEL_ALIASES = {
  全屬性: ['全屬性'],
  最大HP: ['最大HP'],
  最大MP: ['最大MP'],
  '最大HP/最大MP': ['最大HP', '最大MP'],
  '攻擊力/魔力': ['攻擊力', '魔法攻擊力'],
  攻擊力: ['攻擊力'],
  魔力: ['魔法攻擊力'],
  防禦力: ['防禦力'],
  攻擊Boss怪物時傷害: ['BOSS怪物傷害'],
  BOSS怪物傷害: ['BOSS怪物傷害'],
  無視怪物防禦率: ['無視防禦率'],
  無視防禦率: ['無視防禦率'],
  爆擊傷害: ['爆擊傷害'],
};

const SET_MAIN_LABELS = new Set([
  'STR', 'DEX', 'INT', 'LUK', '最大HP', '最大MP', '攻擊力', '魔法攻擊力', '防禦力', '魔法防禦力',
]);

function expandSetStatLabel(raw) {
  const key = String(raw || '').replace(/\s+/g, '');
  return SET_STAT_LABEL_ALIASES[key] || [String(raw || '').trim()];
}

function applySetEffectLine(line, acc) {
  String(line || '').split(/[,，]/).forEach((clause) => {
    const text = clause.trim();
    if (!text) return;
    const m = text.match(/^(.+?)\s*\+(\d+(?:\.\d+)?)(%?)$/);
    if (!m) return;
    const labels = expandSetStatLabel(m[1]);
    const value = Number(m[2]) || 0;
    const isPercent = m[3] === '%';
    if (!value) return;
    labels.forEach((label) => {
      if (/無視.*防禦/.test(label) && isPercent) {
        acc.ied.push(value);
        acc.extra[label] = (acc.extra[label] || 0) + value;
        acc.extraPercent[label] = true;
        return;
      }
      if (isPercent && (label === '最大HP' || label === '最大MP')) {
        const pctKey = `${label}%`;
        acc.extra[pctKey] = (acc.extra[pctKey] || 0) + value;
        acc.extraPercent[pctKey] = true;
        return;
      }
      if (!isPercent && SET_MAIN_LABELS.has(label)) {
        acc.main[label] = (acc.main[label] || 0) + value;
        return;
      }
      acc.extra[label] = (acc.extra[label] || 0) + value;
      if (isPercent) acc.extraPercent[label] = true;
    });
  });
}

/** 目前（或指定）穿著的套裝效果加總，供戰鬥力／屬性面板使用 */
function collectEquipSetBonuses(entries) {
  const wornList = wornListFromEntries(entries);
  const acc = { main: {}, extra: {}, extraPercent: {}, ied: [], details: [] };
  Object.values(EQUIP_SET_DEFS).forEach((def) => {
    const snap = snapshotSetFromWornList(def, wornList);
    if (!snap.wornCount) return;
    const setAcc = { main: {}, extra: {}, extraPercent: {}, ied: [] };
    snap.effects.forEach((block) => {
      if (!block.active) return;
      block.lines.forEach((line) => {
        applySetEffectLine(line, acc);
        applySetEffectLine(line, setAcc);
      });
    });
    acc.details.push({
      id: def.id,
      name: def.name,
      wornCount: snap.wornCount,
      total: snap.total,
      totals: setAcc,
    });
  });
  return acc;
}
