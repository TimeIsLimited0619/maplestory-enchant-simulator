import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = 'C:/Users/Time/Downloads/能源附加與主要潛能機率權重數值表.csv';
const outPath = path.join(__dirname, '../js/energyBadgePotentialValues.js');

const text = fs.readFileSync(csvPath, 'utf8');
const lines = text.split(/\r?\n/);
const rankMap = { 特殊: 'special', 稀有: 'rare', 罕見: 'unique', 傳說: 'legendary' };

function parseWeight(w) {
  const m = String(w || '').match(/^(\d+)\*(\d+)%/);
  if (!m) return null;
  return { weight: Number(m[1]), active: Number(m[2]) > 0 };
}

function normalizeStat(s) {
  return String(s).trim().replace(/\s+/g, '');
}

const add = { special: [], rare: [], unique: [], legendary: [] };
const main = { special: [], rare: [], unique: [], legendary: [] };
let addRank = null;
let mainRank = null;

for (const line of lines) {
  const c = line.split(',');
  const L = [c[0], c[1], c[2]].map((x) => (x || '').trim());
  const R = [c[5], c[6], c[7]].map((x) => (x || '').trim());

  if (L[0].startsWith('套用階級:') && R[0].startsWith('套用階級:')) {
    addRank = rankMap[L[0].split(':')[1]];
    mainRank = rankMap[R[0].split(':')[1]];
  } else {
    if (L[0].startsWith('套用階級:') && L[2].includes('附加')) {
      addRank = rankMap[L[0].split(':')[1]] || null;
    }
    if (R[0].startsWith('套用階級:')) {
      mainRank = rankMap[R[0].split(':')[1]] || null;
    }
  }

  if (L[0] && L[0] !== '潛能' && !L[0].startsWith('套用') && L[0] !== '總計' && addRank) {
    const pw = parseWeight(L[2]);
    if (pw && pw.active) add[addRank].push({ stat: normalizeStat(L[0]), weight: pw.weight });
  }
  if (R[0] && R[0] !== '潛能' && !R[0].startsWith('套用') && R[0] !== '總計' && mainRank) {
    const pw = parseWeight(R[2]);
    if (pw && pw.active) main[mainRank].push({ stat: normalizeStat(R[0]), weight: pw.weight });
  }
}

function fmtEntries(arr) {
  return arr
    .map((e) => `    { stat: '${e.stat.replace(/'/g, "\\'")}', weight: ${e.weight} }`)
    .join(',\n');
}

function fmtPool(name, pool) {
  return (
    `const ${name} = {\n`
    + ['special', 'rare', 'unique', 'legendary']
      .map((k) => {
        const total = pool[k].reduce((s, x) => s + x.weight, 0);
        return `  ${k}: {\n    total: ${total},\n    entries: [\n${fmtEntries(pool[k])}\n    ]\n  }`;
      })
      .join(',\n')
    + '\n};\n'
  );
}

const out = `/**
 * 能源／徽章（islot En / EQUIP_TYPE.Energy）獨立潛能表
 * 來源：能源附加與主要潛能機率權重數值表.csv
 * 主潛 / 附潛、各階級分開；僅權重 *100% 列進池
 */

const ENERGY_POTENTIAL_MAIN_CUBE_KEYS = [
  'restore',
  'shiningMirror',
  'dazzling',
  'equal',
  'union'
];

const ENERGY_POTENTIAL_ADD_CUBE_KEYS = [
  'precious',
  'restoreAdd',
  'absoluteAdd',
  'unionAdd'
];

${fmtPool('ENERGY_POTENTIAL_MAIN_BY_RANK', main)}
${fmtPool('ENERGY_POTENTIAL_ADD_BY_RANK', add)}

function isEnergyBadgeItem(item) {
  return item?.mainType === EQUIP_TYPE.Energy
    || item?.islot === 'En';
}

function isEnergyAddPotentialContext(context = {}) {
  return Number(context.eventId) === 8422
    || ENERGY_POTENTIAL_ADD_CUBE_KEYS.includes(context.rateKey);
}

function buildEnergyPotentialRates(weight, total, cubeKeys) {
  const rate = total > 0 ? weight / total : 0;
  const rates = {};
  cubeKeys.forEach((key) => {
    rates[key] = rate;
  });
  return rates;
}

function buildEnergyPotentialGroup(rankKey, pool, cubeKeys) {
  const pack = pool[rankKey];
  if (!pack?.entries?.length) return null;
  return {
    major: '能源/徽章',
    minor: '徽章',
    entries: pack.entries.map((row) => ({
      stat: row.stat,
      scope: '能源/徽章專用',
      rates: buildEnergyPotentialRates(row.weight, pack.total, cubeKeys)
    }))
  };
}

const ENERGY_POTENTIAL_MAIN_GROUPS = Object.fromEntries(
  ['special', 'rare', 'unique', 'legendary'].map((rank) => [
    rank,
    buildEnergyPotentialGroup(rank, ENERGY_POTENTIAL_MAIN_BY_RANK, ENERGY_POTENTIAL_MAIN_CUBE_KEYS)
  ])
);

const ENERGY_POTENTIAL_ADD_GROUPS = Object.fromEntries(
  ['special', 'rare', 'unique', 'legendary'].map((rank) => [
    rank,
    buildEnergyPotentialGroup(rank, ENERGY_POTENTIAL_ADD_BY_RANK, [
      ...ENERGY_POTENTIAL_MAIN_CUBE_KEYS,
      ...ENERGY_POTENTIAL_ADD_CUBE_KEYS
    ])
  ])
);

/** @param {string} officialRank
 *  @param {{ eventId?: number, rateKey?: string }} [context] */
function getEnergyPotentialStatRateGroup(officialRank, context = {}) {
  if (!officialRank) return null;
  const useAdd = isEnergyAddPotentialContext(context);
  const groups = useAdd ? ENERGY_POTENTIAL_ADD_GROUPS : ENERGY_POTENTIAL_MAIN_GROUPS;
  return groups[officialRank] || null;
}

function parseEnergyPotentialStat(statName) {
  if (!statName) return null;

  if (/機率/.test(statName) || /發動/.test(statName)) {
    return { label: statName, value: '' };
  }

  const levelScale = String(statName).match(/^以角色等級為準每9級(STR|DEX|INT|LUK)\\+(\\d+)$/);
  if (levelScale) {
    return {
      label: '以角色等級為準每9級 ' + levelScale[1] + ' +' + levelScale[2],
      value: ''
    };
  }

  const match = String(statName).match(/^(.+?)\\+(\\d+)(%?)$/);
  if (!match) return { label: statName, value: '' };

  const baseName = match[1];
  const num = Number(match[2]);
  const isPercent = match[3] === '%';
  const label = typeof formatPotentialBossDamageLabel === 'function'
    ? formatPotentialBossDamageLabel(baseName)
    : baseName;

  return {
    label,
    value: isPercent ? (num + '%') : String(num)
  };
}

function formatEnergyPotentialStatValue(statName) {
  const parsed = parseEnergyPotentialStat(statName);
  return parsed ? parsed.value : null;
}
`;

fs.writeFileSync(outPath, out, 'utf8');
console.log('wrote', outPath);
for (const k of ['special', 'rare', 'unique', 'legendary']) {
  console.log('main', k, main[k].length, main[k].reduce((s, x) => s + x.weight, 0));
  console.log('add', k, add[k].length, add[k].reduce((s, x) => s + x.weight, 0));
}
