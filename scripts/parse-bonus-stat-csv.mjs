/**
 * 楓之谷_輪迴星火附加屬性完整設定與數值對照表(星火機率與屬性種類).csv
 * → js/bonusStatValues.js
 *
 * 九級星火：依 1~7 級最後一階增量 (L7-L6) 線性外推 L8、L9
 *
 * 用法: node scripts/parse-bonus-stat-csv.mjs [csvPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEFAULT_CSV = process.argv[2] || path.join(ROOT, 'data', 'bonus-stat-source.csv');
const OUT_JS = path.join(ROOT, 'js', 'bonusStatValues.js');
const LEGACY_JS = OUT_JS;

const csvPath = process.argv[2] || DEFAULT_CSV;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      if (ch === '\r') i += 1;
    } else if (ch !== '\r') {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function parsePct(s) {
  if (s == null || s === '') return null;
  const m = String(s).trim().match(/^([\d.]+)%?$/);
  return m ? Number(m[1]) : null;
}

function parseNum(s) {
  if (s == null || s === '') return null;
  const text = String(s).trim().replace(/,/g, '');
  if (text.endsWith('%')) return parsePct(text);
  const m = text.match(/-?[\d.]+/);
  return m ? Number(m[0]) : null;
}

function parseLevelRange(label) {
  const text = String(label || '').trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) {
    const n = Number(text);
    return { minLevel: n, maxLevel: n };
  }
  const m = text.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  return { minLevel: Number(m[1]), maxLevel: Number(m[2]) };
}

function extendLevels(vals7, isPercent = false) {
  const inc = vals7[6] - vals7[5];
  const lv8 = vals7[6] + inc;
  const lv9 = lv8 + inc;

  if (isPercent) {
    const fmt = (x) => {
      const s = x.toFixed(4).replace(/\.?0+$/, '');
      return `${s}%`;
    };
    return [...vals7.map(fmt), fmt(lv8), fmt(lv9)];
  }

  if (vals7.every((v) => Number.isInteger(v))) {
    return [...vals7.map((v) => Math.round(v)), Math.round(lv8), Math.round(lv9)];
  }

  return [...vals7, lv8, lv9];
}

function readLevelTable(rows, startRow, endRow, valueCols = 7, isPercent = false) {
  const out = [];
  for (let r = startRow; r <= endRow; r += 1) {
    const label = rows[r]?.[0];
    const range = parseLevelRange(label);
    if (!range) continue;

    const vals = [];
    for (let c = 1; c < 1 + valueCols; c += 1) {
      const raw = rows[r][c];
      vals.push(isPercent ? parsePct(raw) : parseNum(raw));
    }
    if (vals.some((v) => v == null)) continue;

    out.push({
      minLevel: range.minLevel,
      maxLevel: range.maxLevel,
      values: extendLevels(vals, isPercent),
    });
  }
  return out;
}

function findRowIndex(rows, predicate, from = 0) {
  for (let i = from; i < rows.length; i += 1) {
    if (predicate(rows[i])) return i;
  }
  return -1;
}

function findSectionRow(rows, marker) {
  return findRowIndex(rows, (row) => {
    const cell = String(row?.[0] || '');
    return cell.startsWith('【') && cell.includes(marker);
  });
}

function parseStatPool(text) {
  if (!text) return [];
  return String(text)
    .split('/')
    .map((part) => part.trim().replace(/\s+/g, ''))
    .filter(Boolean)
    .map((part) => part.replace(/^最大HP$/i, '最大HP').replace(/^最大MP$/i, '最大MP'));
}

function readFixedStats(rows) {
  const start = findSectionRow(rows, '防具攻擊力 / 固定值與特殊百分比屬性');
  if (start < 0) return {};

  const fixed = {};
  for (let r = start + 2; r < rows.length; r += 1) {
    const name = String(rows[r]?.[0] || '').trim();
    if (!name || name.startsWith('【') || name.includes('對照表')) break;

    const valsRaw = rows[r].slice(2, 9);
    if (!valsRaw.length || valsRaw.every((v) => v == null || v === '')) continue;

    const isPct = valsRaw.some((v) => String(v).includes('%'));
    const vals = valsRaw.map((v) => (isPct ? parsePct(v) : parseNum(v)));
    if (vals.some((v) => v == null)) continue;

    const ext = extendLevels(vals, false);

    if (isPct && name.includes('全屬性')) {
      fixed.allStatPct = ext.map((v) => Math.round(v));
    } else if (isPct && name.toUpperCase().includes('BOSS')) {
      fixed.bossDmgPct = ext.map((v) => Math.round(v));
    } else if (isPct && name.includes('傷害')) {
      fixed.dmgPct = ext.map((v) => Math.round(v));
    } else if (name.includes('防具攻擊') || name.includes('魔法攻擊力')) {
      fixed.armorAtkFlat = ext.map((v) => Math.round(v));
    } else if (name.includes('移動')) {
      fixed.speed = ext.map((v) => Math.round(v));
    } else if (name.includes('跳躍')) {
      fixed.jump = ext.map((v) => Math.round(v));
    } else if (name.includes('裝備需求等級') || name.includes('穿戴')) {
      fixed.levelReduce = ext.map((v) => Math.round(v));
    }
  }

  return fixed;
}

function loadLegacyStarProb() {
  if (!fs.existsSync(LEGACY_JS)) return {};
  const text = fs.readFileSync(LEGACY_JS, 'utf8');
  const m = text.match(/const BONUS_STAT_STAR_LEVEL_PROB = (\{[\s\S]*?\});/);
  if (!m) return {};
  try {
    return JSON.parse(m[1]);
  } catch {
    return {};
  }
}

const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(raw);

const starLevelProb = {};
const legacyStarProb = loadLegacyStarProb();

for (let r = 0; r < rows.length; r += 1) {
  const label = String(rows[r]?.[0] || '').trim();
  if (label.startsWith('註：') || label.startsWith('註:')) continue;
  if (parsePct(rows[r]?.[1]) == null) continue;

  if (label.includes('覺醒的輪迴星火') && /Awake/i.test(label)) {
    starLevelProb.awakened = {
      2: parsePct(rows[r][1]) || 0,
      3: parsePct(rows[r][2]) || 0,
      4: parsePct(rows[r][3]) || 0,
      5: parsePct(rows[r][4]) || 0,
      6: parsePct(rows[r][5]) || 0,
    };
  }
  if (label.includes('覺醒的暗黑輪迴星火') || /awake_black/i.test(label)) {
    starLevelProb.blackAwakened = {
      2: parsePct(rows[r][1]) || 0,
      3: parsePct(rows[r][2]) || 0,
      4: parsePct(rows[r][3]) || 0,
      5: parsePct(rows[r][4]) || 0,
      6: parsePct(rows[r][5]) || 0,
    };
  }
}

if (legacyStarProb.enhanced) starLevelProb.enhanced = legacyStarProb.enhanced;
if (legacyStarProb.eternal) starLevelProb.eternal = legacyStarProb.eternal;

let lineCountProb = { general: [0, 0, 0, 100], boss: [0, 0, 0, 100] };
const lineRow = findRowIndex(rows, (row) => String(row?.[0] || '').trim() === '所有裝備');
if (lineRow >= 0) {
  const counts = [
    parsePct(rows[lineRow][1]) || 0,
    parsePct(rows[lineRow][2]) || 0,
    parsePct(rows[lineRow][3]) || 0,
    parsePct(rows[lineRow][4]) || 0,
  ];
  lineCountProb = { general: counts, boss: [...counts] };
}

let weaponStats = [];
let armorStats = [];
const weaponRow = findRowIndex(rows, (row) => String(row?.[0] || '').trim() === '武器');
const armorRow = findRowIndex(rows, (row) => String(row?.[0] || '').startsWith('其他裝備'));
if (weaponRow >= 0) weaponStats = parseStatPool(rows[weaponRow][1]);
if (armorRow >= 0) armorStats = parseStatPool(rows[armorRow][1]);

function readSectionTable(marker) {
  const sectionRow = findSectionRow(rows, marker);
  if (sectionRow < 0) return [];
  const headerRow = sectionRow + 1;
  let endRow = headerRow;
  while (endRow + 1 < rows.length) {
    const nextLabel = String(rows[endRow + 1]?.[0] || '').trim();
    if (!nextLabel) {
      endRow += 1;
      continue;
    }
    if (nextLabel.startsWith('【') || nextLabel.includes('對照表')) break;
    if (!parseLevelRange(nextLabel) && nextLabel !== '裝備等級') break;
    endRow += 1;
  }
  const isPercent = marker.includes('%');
  return readLevelTable(rows, headerRow + 1, endRow, 7, isPercent);
}

const watkPctGeneral = readSectionTable('武器攻擊力 / 魔法攻擊力增加 % (一般裝備)');
const watkPctBoss = readSectionTable('武器攻擊力 / 魔法攻擊力增加 % (高級裝備)');
const singleMain = readSectionTable('單一主屬性');
const dualMain = readSectionTable('複合主屬性');
const defTable = readSectionTable('防禦力');
const hpMp = readSectionTable('HP上限');

const data = {
  source: path.basename(csvPath),
  starLevelProb,
  lineCountProb,
  statPools: { weapon: weaponStats, armor: armorStats },
  valueTables: {
    singleMain,
    dualMain,
    def: defTable,
    hpMp,
    watkPctGeneral,
    watkPctBoss,
    matkPctGeneral: watkPctGeneral,
    matkPctBoss: watkPctBoss,
    fixed: readFixedStats(rows),
  },
  starLineTiers: 9,
  extrapolationNote: '星火8、9級 = 星火7 + (星火7-星火6) × n，n=1,2',
};

const runtimeTail = `
/** 星火 stat 名稱 → 內部 key */
const BONUS_STAT_NAME_TO_KEY = {
  'STR': { key: 'str', table: 'singleMain' },
  'DEX': { key: 'dex', table: 'singleMain' },
  'INT': { key: 'int', table: 'singleMain' },
  'LUK': { key: 'luk', table: 'singleMain' },
  'STR+DEX': { key: 'strDex', table: 'dualMain', dual: ['str', 'dex'] },
  'STR+INT': { key: 'strInt', table: 'dualMain', dual: ['str', 'int'] },
  'STR+LUK': { key: 'strLuk', table: 'dualMain', dual: ['str', 'luk'] },
  'DEX+INT': { key: 'dexInt', table: 'dualMain', dual: ['dex', 'int'] },
  'DEX+LUK': { key: 'dexLuk', table: 'dualMain', dual: ['dex', 'luk'] },
  'INT+LUK': { key: 'intLuk', table: 'dualMain', dual: ['int', 'luk'] },
  '最大HP': { key: 'maxHp', table: 'hpMp', isPercent: false },
  '最大MP': { key: 'maxMp', table: 'hpMp', isPercent: false },
  '防禦力': { key: 'def', table: 'def' },
  '攻擊力': { key: 'watk', weaponPct: 'watkPct', armorFixedKey: 'armorAtkFlat' },
  '魔力': { key: 'matk', weaponPct: 'matkPct', armorFixedKey: 'armorAtkFlat' },
  '物理攻擊力': { key: 'watk', weaponPct: 'watkPct', armorFixedKey: 'armorAtkFlat' },
  '魔法攻擊力': { key: 'matk', weaponPct: 'matkPct', armorFixedKey: 'armorAtkFlat' },
  '物理攻擊力%': { key: 'watkPct', weaponPct: 'watkPct' },
  '魔法攻擊力%': { key: 'matkPct', weaponPct: 'matkPct' },
  '全屬性%': { key: 'allStat', table: 'fixed', fixedKey: 'allStatPct', isPercent: true },
  '攻擊BOSS怪物時傷害%': { key: 'bossDmg', table: 'fixed', fixedKey: 'bossDmgPct', isPercent: true },
  '傷害%': { key: 'dmg', table: 'fixed', fixedKey: 'dmgPct', isPercent: true },
  '移動速度': { key: 'speed', table: 'fixed', fixedKey: 'speed' },
  '跳躍力': { key: 'jump', table: 'fixed', fixedKey: 'jump' },
  '穿戴等級減少': { key: 'levelReduce', table: 'fixed', fixedKey: 'levelReduce' },
};

function bsParsePercentString(s) {
  if (typeof s === 'number') return s;
  const m = String(s).match(/^([\\d.]+)%?$/);
  return m ? parseFloat(m[1]) : 0;
}

function bsFindLevelRow(table, reqLevel) {
  if (!table?.length) return null;
  const lv = Math.max(0, Math.floor(Number(reqLevel) || 0));
  return table.find((row) => lv >= row.minLevel && lv <= row.maxLevel)
    || table[table.length - 1];
}

function bsGetTableValue(tableName, reqLevel, starTier, item, options = {}) {
  const tier = Math.max(1, Math.min(BONUS_STAT_STAR_LINE_TIERS, Math.floor(Number(starTier) || 1)));
  const idx = tier - 1;

  if (tableName === 'fixed') {
    const fk = options.fixedKey;
    const arr = BONUS_STAT_VALUE_TABLES.fixed?.[fk];
    return arr ? arr[idx] : 0;
  }

  if (tableName === 'watkPct' || tableName === 'matkPct') {
    const isBoss = options.isBossGear;
    const sub = tableName === 'watkPct'
      ? (isBoss ? 'watkPctBoss' : 'watkPctGeneral')
      : (isBoss ? 'matkPctBoss' : 'matkPctGeneral');
    const row = bsFindLevelRow(BONUS_STAT_VALUE_TABLES[sub], reqLevel);
    return row ? bsParsePercentString(row.values[idx]) : 0;
  }

  const row = bsFindLevelRow(BONUS_STAT_VALUE_TABLES[tableName], reqLevel);
  if (!row) return 0;
  const raw = row.values[idx];
  return typeof raw === 'string' ? bsParsePercentString(raw) : Number(raw) || 0;
}

function bsRollWeighted(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return entries[0]?.value;
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.value;
  }
  return entries[entries.length - 1]?.value;
}

function bsRollStarFireLevel(starFireType = 'enhanced') {
  const prob = BONUS_STAT_STAR_LEVEL_PROB[starFireType]
    || BONUS_STAT_STAR_LEVEL_PROB.enhanced;
  const entries = [2, 3, 4, 5, 6]
    .map((value) => ({ value, weight: prob[value] || 0 }))
    .filter((entry) => entry.weight > 0);
  return bsRollWeighted(entries.length ? entries : [{ value: 2, weight: 1 }]);
}

function bsRollLineCount(isBossGear) {
  const prob = isBossGear
    ? BONUS_STAT_LINE_COUNT_PROB.boss
    : BONUS_STAT_LINE_COUNT_PROB.general;
  return bsRollWeighted([
    { value: 1, weight: prob[0] || 0 },
    { value: 2, weight: prob[1] || 0 },
    { value: 3, weight: prob[2] || 0 },
    { value: 4, weight: prob[3] || 0 },
  ]);
}

/** 每條附加屬性詞條的星火 tier（1~9） */
function bsRollLineStarTier(starFireLevel, item, starFireType = 'enhanced') {
  let effective = starFireLevel;
  if (starFireType === 'awakened' || starFireType === 'blackAwakened') {
    effective = Math.min(7, Math.max(3, effective + 2));
  }
  const maxTier = Math.min(BONUS_STAT_STAR_LINE_TIERS, Math.max(1, (effective - 1) * 2));
  return 1 + Math.floor(Math.random() * maxTier);
}

function bsIsBossGearItem(item) {
  return Boolean(item?.isBossGear);
}

function bsIsWeaponItem(item) {
  return item?.mainType === 'WEAPON' || item?.subType === 'weapon';
}

function bsGetStatPool(item) {
  return bsIsWeaponItem(item)
    ? BONUS_STAT_STAT_POOL.weapon
    : BONUS_STAT_STAT_POOL.armor;
}

function bsCanRollStat(statName, item) {
  const req = item?.reqLevel || 200;
  const isWeapon = bsIsWeaponItem(item);
  if (statName === '攻擊BOSS怪物時傷害%' && req < 90) return false;
  if ((statName === '攻擊力' || statName === '魔力') && !isWeapon && req < 60) return false;
  if (statName === '全屬性%' && req < 70) return false;
  return true;
}

function bsResolveStatLine(statName, starTier, item) {
  const meta = BONUS_STAT_NAME_TO_KEY[statName];
  if (!meta) return null;
  const reqLevel = item?.reqLevel || 200;
  const isBoss = bsIsBossGearItem(item);
  const isWeapon = bsIsWeaponItem(item);

  if (meta.dual) {
    const v = bsGetTableValue(meta.table, reqLevel, starTier, item);
    return {
      statId: meta.key,
      dual: meta.dual,
      value: v,
      isPercent: false,
      label: statName,
      starTier,
    };
  }

  if (meta.weaponPct && (statName === '攻擊力' || statName === '魔力' || meta.weaponPct)) {
    if (isWeapon) {
      const pctTable = meta.weaponPct;
      const v = bsGetTableValue(pctTable, reqLevel, starTier, item, { isBossGear: isBoss });
      return {
        statId: meta.key,
        value: v,
        isPercent: true,
        label: statName === '魔力' ? '魔法攻擊力' : '物理攻擊力',
        starTier,
      };
    }
    const v = bsGetTableValue('fixed', reqLevel, starTier, item, { fixedKey: meta.armorFixedKey || 'armorAtkFlat' });
    return {
      statId: meta.key,
      value: v,
      isPercent: false,
      label: statName === '魔力' ? '魔法攻擊力' : '物理攻擊力',
      starTier,
    };
  }

  if (meta.table === 'fixed') {
    const v = bsGetTableValue('fixed', reqLevel, starTier, item, { fixedKey: meta.fixedKey });
    return {
      statId: meta.key,
      value: v,
      isPercent: Boolean(meta.isPercent),
      label: statName.replace(/%$/, ''),
      starTier,
    };
  }

  if (meta.table === 'watkPct' || meta.table === 'matkPct') {
    const v = bsGetTableValue(meta.table, reqLevel, starTier, item, { isBossGear: isBoss });
    return { statId: meta.key, value: v, isPercent: true, label: statName.replace(/%$/, ''), starTier };
  }

  const v = bsGetTableValue(meta.table, reqLevel, starTier, item);
  const isPercent = meta.isPercent || statName.includes('%');
  return {
    statId: meta.key,
    value: v,
    isPercent,
    label: statName.replace(/%$/, ''),
    starTier,
  };
}

function bsPickStatFromPool(pool, usedLabels, item) {
  const available = pool.filter(
    (name) => !usedLabels.has(name) && bsCanRollStat(name, item)
  );
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function bsRollBonusStatLines(item, starFireType = 'enhanced', starFireLevel = null) {
  const sfLevel = starFireLevel ?? bsRollStarFireLevel(starFireType);
  const lineCount = bsRollLineCount(bsIsBossGearItem(item));
  const pool = bsGetStatPool(item);
  const used = new Set();
  const lines = [];

  for (let i = 0; i < lineCount; i += 1) {
    const statName = bsPickStatFromPool(pool, used, item);
    if (!statName) break;
    used.add(statName);
    const tier = bsRollLineStarTier(sfLevel, item, starFireType);
    const rolled = bsResolveStatLine(statName, tier, item);
    if (!rolled) continue;
    lines.push(rolled);
  }
  return { starFireLevel: sfLevel, starFireType, lines };
}
`;

const js = `/**
 * 輪迴星火附加屬性數值表（自動產生）
 * 來源：${data.source}
 * ${data.extrapolationNote}
 * 產生：scripts/parse-bonus-stat-csv.mjs
 */

const BONUS_STAT_STAR_LEVEL_PROB = ${JSON.stringify(data.starLevelProb, null, 2)};

const BONUS_STAT_LINE_COUNT_PROB = ${JSON.stringify(data.lineCountProb, null, 2)};

const BONUS_STAT_STAT_POOL = ${JSON.stringify(data.statPools, null, 2)};

const BONUS_STAT_VALUE_TABLES = ${JSON.stringify(data.valueTables, null, 2)};

const BONUS_STAT_STAR_LINE_TIERS = ${data.starLineTiers};

${runtimeTail}`;

fs.writeFileSync(OUT_JS, js, 'utf8');
console.log('Wrote', OUT_JS);
console.log('Star types:', Object.keys(data.starLevelProb).join(', '));
console.log('Weapon stats:', data.statPools.weapon.length, '| Armor stats:', data.statPools.armor.length);
console.log('Tables:', Object.keys(data.valueTables).map((k) => `${k}:${data.valueTables[k]?.length ?? Object.keys(data.valueTables[k] || {}).length}`).join(', '));
