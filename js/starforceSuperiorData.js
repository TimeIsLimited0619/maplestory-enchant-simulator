/**
 * Superior／暴君星力建檔（MapleStory Wiki Stat Tables）
 * 之後加入裝備時把 itemId 填進對應 SET 即可自動套用最高星、費用與屬性。
 */

const SUPERIOR_STARFORCE_SETS = {
  heliseum: { id: 'heliseum', name: '精英赫力席蒙', maxStar: 3 },
  nova: { id: 'nova', name: '諾巴', maxStar: 8 },
  tyrant: { id: 'tyrant', name: '暴君', maxStar: 15 },
};

function padStarForceItemId(id) {
  return String(id || '').replace(/\D/g, '').replace(/^0+/, '').padStart(8, '0');
}

function addStarForceIdRange(target, from, to) {
  const start = Number(from);
  const end = Number(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return;
  for (let n = start; n <= end; n += 1) {
    target[padStarForceItemId(n)] = true;
  }
}

/** 精英赫力席蒙（Lv80，最高 3 星）：披風／鞋子／腰帶 */
const STARFORCE_HELISEUM_ITEM_IDS = {};
addStarForceIdRange(STARFORCE_HELISEUM_ITEM_IDS, 1102471, 1102475);
addStarForceIdRange(STARFORCE_HELISEUM_ITEM_IDS, 1072732, 1072736);
addStarForceIdRange(STARFORCE_HELISEUM_ITEM_IDS, 1132164, 1132168);

/** 諾巴／超新星（Lv110，最高 8 星）：披風／鞋子／腰帶 */
const STARFORCE_NOVA_ITEM_IDS = {};
addStarForceIdRange(STARFORCE_NOVA_ITEM_IDS, 1102476, 1102480);
addStarForceIdRange(STARFORCE_NOVA_ITEM_IDS, 1072737, 1072741);
addStarForceIdRange(STARFORCE_NOVA_ITEM_IDS, 1132169, 1132173);

/** 暴君（Lv150，最高 15 星）：披風／鞋子／腰帶／手套 */
const STARFORCE_TYRANT_ITEM_IDS = {};
addStarForceIdRange(STARFORCE_TYRANT_ITEM_IDS, 1102481, 1102485);
addStarForceIdRange(STARFORCE_TYRANT_ITEM_IDS, 1072743, 1072747);
addStarForceIdRange(STARFORCE_TYRANT_ITEM_IDS, 1132174, 1132178);
addStarForceIdRange(STARFORCE_TYRANT_ITEM_IDS, 1082543, 1082547);

const SUPERIOR_STARFORCE_ID_SETS = [
  { setId: 'tyrant', ids: STARFORCE_TYRANT_ITEM_IDS },
  { setId: 'heliseum', ids: STARFORCE_HELISEUM_ITEM_IDS },
  { setId: 'nova', ids: STARFORCE_NOVA_ITEM_IDS },
];

/**
 * Superior 全屬／攻擊累積（索引＝星數）
 * 欄位：0–77 / 78–87 / 88–97 / 98–107 / 108–117 / 118–127 / 128–137 / 138–149 / 150+
 */
const SUPERIOR_STAR_ALLSTAT_CUMULATIVE = {
  '0-77': [0, 1, 3, 7],
  '78-87': [0, 2, 5, 10],
  '88-97': [0, 4, 9, 16, 26, 40],
  '98-107': [0, 7, 15, 25, 38, 55],
  '108-117': [0, 9, 19, 31, 46, 65, 65, 65, 65],
  '118-127': [0, 12, 23, 40, 58, 80, 80, 80, 80, 80, 80],
  '128-137': [0, 14, 29, 46, 66, 90, 90, 90, 90, 90, 90, 90, 90],
  '138-149': [0, 17, 35, 55, 78, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],
  '150+': [0, 19, 39, 61, 86, 115, 115, 115, 115, 115, 115, 115, 115, 115, 115, 115],
};

const SUPERIOR_STAR_ATT_CUMULATIVE = {
  '0-77': [0, 0, 0, 0],
  '78-87': [0, 0, 0, 0],
  '88-97': [0, 0, 0, 0, 0, 0],
  '98-107': [0, 0, 0, 0, 0, 0],
  '108-117': [0, 0, 0, 0, 0, 0, 5, 11, 18],
  '118-127': [0, 0, 0, 0, 0, 0, 6, 13, 21, 30, 40],
  '128-137': [0, 0, 0, 0, 0, 0, 7, 15, 24, 34, 45, 58, 73],
  '138-149': [0, 0, 0, 0, 0, 0, 8, 17, 27, 38, 50, 64, 80, 98, 118, 140],
  '150+': [0, 0, 0, 0, 0, 0, 9, 19, 30, 42, 55, 70, 87, 106, 127, 150],
};

function resolveSuperiorStarLevelRange(reqLevel) {
  const level = Number(reqLevel) || 0;
  if (level <= 77) return '0-77';
  if (level <= 87) return '78-87';
  if (level <= 97) return '88-97';
  if (level <= 107) return '98-107';
  if (level <= 117) return '108-117';
  if (level <= 127) return '118-127';
  if (level <= 137) return '128-137';
  if (level <= 149) return '138-149';
  return '150+';
}

function lookupSuperiorStarForceSetId(item) {
  const id = padStarForceItemId(item?.itemId || item?.id);
  for (const entry of SUPERIOR_STARFORCE_ID_SETS) {
    if (entry.ids[id]) return entry.setId;
  }
  return '';
}

function isSuperiorStarForceItem(item) {
  if (!item) return false;
  if (item.superiorEqp || item.superiorStarForce) return true;
  return Boolean(lookupSuperiorStarForceSetId(item));
}

function getSuperiorStarForceSet(item) {
  const setId = lookupSuperiorStarForceSetId(item) || item?.superiorStarForceSet;
  return setId ? SUPERIOR_STARFORCE_SETS[setId] || null : null;
}

function getSuperiorStarForceMaxStar(item) {
  const set = getSuperiorStarForceSet(item);
  if (set) return set.maxStar;
  // 與 SUPERIOR_STAR_*_CUMULATIVE 各等級欄長度一致（索引＝星數）
  const range = resolveSuperiorStarLevelRange(item?.reqLevel);
  const table = SUPERIOR_STAR_ALLSTAT_CUMULATIVE[range] || SUPERIOR_STAR_ALLSTAT_CUMULATIVE['150+'];
  return Math.max(0, table.length - 1);
}

/** Superior 費用與星數無關：1000 + round(L^3.56)，再四捨五入至百位 */
function getSuperiorStarForceMesoCost(item) {
  const L = typeof getStarForceCostLevel === 'function'
    ? getStarForceCostLevel(item?.reqLevel)
    : Math.floor(Math.max(0, Number(item?.reqLevel) || 0) / 10) * 10;
  const raw = 1000 + Math.round(L ** 3.56);
  return Math.round(raw / 100) * 100;
}

function getSuperiorStarForceBonusAtStar(starCount, item) {
  const maxStar = getSuperiorStarForceMaxStar(item);
  const star = Math.max(0, Math.min(maxStar, starCount || 0));
  const range = resolveSuperiorStarLevelRange(item?.reqLevel);
  const statTable = SUPERIOR_STAR_ALLSTAT_CUMULATIVE[range] || SUPERIOR_STAR_ALLSTAT_CUMULATIVE['150+'];
  const attTable = SUPERIOR_STAR_ATT_CUMULATIVE[range] || SUPERIOR_STAR_ATT_CUMULATIVE['150+'];
  const stat = statTable[star] ?? statTable[statTable.length - 1] ?? 0;
  const att = attTable[star] ?? attTable[attTable.length - 1] ?? 0;
  return { stat, atk: att, matk: att };
}

function applySuperiorStarForceFlags(item) {
  if (!item || !isSuperiorStarForceItem(item)) return item;
  const set = getSuperiorStarForceSet(item);
  item.superiorEqp = true;
  item.superiorStarForce = true;
  if (set) item.superiorStarForceSet = set.id;
  return item;
}
