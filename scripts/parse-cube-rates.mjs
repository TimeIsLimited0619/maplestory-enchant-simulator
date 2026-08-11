/**
 * 從楓之谷官方機率公告 HTML 解析方塊機率，輸出 js/cubeRates/*.js
 * 資料來源：https://maplestory-event.beanfun.com/eventad/eventad?eventadid=XXXX
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'js', 'cubeRates');

const EVENT_PAGES = [
  {
    id: 8421,
    slug: 'potential-main',
    title: '裝備潛能強化方塊',
    cubeColumns: ['restore', 'shiningMirror', 'dazzling', 'equal', 'union'],
    cubeNames: ['恢復方塊', '閃耀鏡射方塊', '閃炫方塊', '新對等方塊', '結合方塊']
  },
  {
    id: 8422,
    slug: 'potential-additional',
    title: '裝備附加潛能強化方塊',
    cubeColumns: ['precious', 'restoreAdd', 'brightAdd', 'absoluteAdd', 'unionAdd'],
    cubeNames: ['珍貴附加方塊', '恢復附加方塊', '閃亮附加方塊', '絕對附加方塊', '結合附加方塊'],
    /** 官方有列但模擬器不建檔（附加 hexa 為自訂） */
    omitCubeColumns: ['brightAdd']
  },
  {
    id: 8630,
    slug: 'potential-other',
    title: '裝備潛能強化方塊(其他)',
    cubeColumns: ['artisan', 'masterArtisan'],
    cubeNames: ['工匠方塊', '名匠方塊']
  },
  {
    id: 8420,
    slug: 'familiar',
    title: '萌獸方塊',
    cubeColumns: ['familiar'],
    cubeNames: ['萌獸方塊']
  }
];

const RANK_MAP = {
  '特殊等級': 'special',
  '特殊屬性': 'special',
  '稀有等級': 'rare',
  '罕見等級': 'unique',
  '傳說等級': 'legendary'
};

const FROM_RANK_MAP = {
  '特殊': 'special',
  '稀有': 'rare',
  '罕見': 'unique',
  '傳說': 'legendary'
};

function cellText($, el) {
  return $(el).text().replace(/\s+/g, ' ').trim();
}

function parsePercent(text) {
  if (!text || text === '' || text === '-') return null;
  const m = String(text).match(/([\d.]+)\s*%/);
  return m ? Number(m[1]) / 100 : null;
}

function expandTable($, table) {
  const matrix = [];
  const $rows = $(table).find('tr');

  $rows.each((trIndex, tr) => {
    const rowIndex = trIndex;
    if (!matrix[rowIndex]) matrix[rowIndex] = [];

    let colIndex = 0;
    $(tr).find('th, td').each((__, td) => {
      while (matrix[rowIndex][colIndex]?._occupied) colIndex++;

      const rowspan = Number($(td).attr('rowspan') || 1);
      const colspan = Number($(td).attr('colspan') || 1);
      const text = cellText($, td);

      for (let r = 0; r < rowspan; r++) {
        for (let c = 0; c < colspan; c++) {
          const ri = rowIndex + r;
          const ci = colIndex + c;
          if (!matrix[ri]) matrix[ri] = [];
          matrix[ri][ci] = {
            text: r === 0 && c === 0 ? text : text,
            _occupied: true
          };
        }
      }
      colIndex += colspan;
    });
  });

  return matrix.map((row) => {
    if (!row) return [];
    const out = [];
    for (let i = 0; i < row.length; i++) {
      out.push(row[i]?.text ?? '');
    }
    while (out.length && out[out.length - 1] === '') out.pop();
    return out;
  });
}

function findSectionTables(html, sectionTitle) {
  const $ = cheerio.load(html);
  const tables = [];
  let inSection = false;

  $('h3, table').each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (tag === 'h3') {
      const title = cellText($, el);
      inSection = sectionTitle.some((t) => title.includes(t));
      return;
    }
    if (inSection && tag === 'table') {
      tables.push(el);
    }
  });

  return tables.map((t) => expandTable($, t));
}

function parseRankUpTable(rows, cubeNames, cubeColumns) {
  const headerIdx = rows.findIndex((r) => r[0] === '道具名稱');
  if (headerIdx < 0) return null;

  const columnKeys = [
    ['fromSpecial', 'special'],
    ['fromSpecial', 'rare'],
    ['fromSpecial', 'unique'],
    ['fromSpecial', 'legendary'],
    ['fromRare', 'rare'],
    ['fromRare', 'unique'],
    ['fromRare', 'legendary'],
    ['fromUnique', 'unique'],
    ['fromUnique', 'legendary']
  ];

  const result = {};
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const name = row[0];
    if (!name || !name.includes('方塊')) continue;

    const cubeId = slugify(name);
    if (result[cubeId]) continue;
    result[cubeId] = { name, rates: {} };

    columnKeys.forEach(([from, to], i) => {
      if (!result[cubeId].rates[from]) result[cubeId].rates[from] = {};
      result[cubeId].rates[from][to] = parsePercent(row[i + 1]);
    });
  }

  return result;
}

function normalizeFromKey(label) {
  const map = {
    '特殊': 'fromSpecial',
    '稀有': 'fromRare',
    '罕見': 'fromUnique'
  };
  return map[label] || `from${label}`;
}

function slugify(name) {
  const map = {
    '恢復方塊': 'restore',
    '閃耀鏡射方塊': 'shiningMirror',
    '閃炫方塊': 'dazzling',
    '新對等方塊': 'equal',
    '結合方塊': 'union',
    '珍貴附加方塊': 'precious',
    '恢復附加方塊': 'restoreAdd',
    '閃亮附加方塊': 'brightAdd',
    '絕對附加方塊': 'absoluteAdd',
    '結合附加方塊': 'unionAdd',
    '工匠方塊': 'artisan',
    '名匠方塊': 'masterArtisan',
    '可疑的方塊': 'suspicious',
    '紅色方塊': 'red',
    '黑色方塊': 'black',
    '萌獸方塊': 'familiar'
  };
  return map[name] || name.replace(/\s/g, '');
}

function parseLineRankRules(rows) {
  const rules = {};
  let currentCube = null;
  let section = 'specialRare';

  for (const row of rows) {
    if (row.some((c) => c.includes('第二排_罕見') || c.includes('第三排_罕見') || c.includes('第二排_傳說'))) {
      section = 'uniqueLegendary';
      continue;
    }
    if (row.some((c) => c.includes('第一排'))) {
      section = 'specialRare';
      continue;
    }

    const name = row[0];
    if (!name) continue;

    if (name.includes('方塊') && row.length > 2) {
      currentCube = slugify(name);
      rules[currentCube] = rules[currentCube] || {};
    }

    if (name === '道具名稱') continue;

    if (currentCube && row.length >= 11 && name.includes('方塊')) {
      if (section === 'uniqueLegendary') {
        rules[currentCube].linesUniqueLegendary = {
          line1: { same: parsePercent(row[1]), lower: parsePercent(row[2]) },
          line2Unique: { same: parsePercent(row[3]), lower: parsePercent(row[4]) },
          line3Unique: { same: parsePercent(row[5]), lower: parsePercent(row[6]) },
          line2Legendary: { same: parsePercent(row[7]), lower: parsePercent(row[8]) },
          line3Legendary: { same: parsePercent(row[9]), lower: parsePercent(row[10]) }
        };
      } else {
        rules[currentCube].lines = {
          line1: { same: parsePercent(row[1]), lower: parsePercent(row[2]) },
          line2Special: { same: parsePercent(row[3]), lower: parsePercent(row[4]) },
          line3Special: { same: parsePercent(row[5]), lower: parsePercent(row[6]) },
          line2Rare: { same: parsePercent(row[7]), lower: parsePercent(row[8]) },
          line3Rare: { same: parsePercent(row[9]), lower: parsePercent(row[10]) }
        };
      }
    }
  }
  return rules;
}

function buildUnionAddSpecialRules(lineRules) {
  const union = lineRules.unionAdd?.lines;
  if (!union) return null;

  const same = union.line2Rare?.same ?? union.line2Special?.same ?? 0.005;
  const lower = union.line2Rare?.lower ?? union.line2Special?.lower ?? 0.995;
  return [
    { slot: '第一個', same, lower, setRate: 1 / 3 },
    { slot: '第二個', same, lower, setRate: 1 / 3 },
    { slot: '第三個', same, lower, setRate: 1 / 3 }
  ];
}

function parseStatRatesTable(rows, cubeColumns) {
  const stats = {};
  let currentRank = null;
  let majorCategory = null;
  let minorCategory = null;
  const minFullLen = 4 + cubeColumns.length;

  const isPercent = (v) => typeof v === 'string' && v.includes('%');

  for (const row of rows) {
    if (!row.length) continue;

    if (row.length >= 1 && row.every((c) => c === row[0] && RANK_MAP[c])) {
      currentRank = RANK_MAP[row[0]];
      majorCategory = null;
      minorCategory = null;
      stats[currentRank] = stats[currentRank] || {};
      continue;
    }

    if (row[0] === '大分類') continue;

    // 完整列：大分類, 小分類, 屬性, 類型, N 個方塊機率
    if (row.length >= minFullLen && isPercent(row[4])) {
      if (row[0]) majorCategory = row[0];
      if (row[1]) minorCategory = row[1];

      const stat = row[2];
      const scope = row[3];
      if (!currentRank || !majorCategory || !stat) continue;

      const key = `${majorCategory}::${minorCategory}`;
      stats[currentRank][key] = stats[currentRank][key] || {
        major: majorCategory,
        minor: minorCategory,
        entries: []
      };

      const rates = {};
      cubeColumns.forEach((col, i) => {
        rates[col] = parsePercent(row[4 + i]);
      });

      stats[currentRank][key].entries.push({ stat, scope, rates });
      continue;
    }

    // 延續列
    if (currentRank && majorCategory && row.length >= cubeColumns.length + 2 && isPercent(row[row.length - 1])) {
      if (isPercent(row[0])) continue;

      let stat;
      let scope;
      let rateStart;

      if (row.length >= minFullLen && !isPercent(row[0]) && isPercent(row[4])) {
        stat = row[2] || row[0];
        scope = row[3] || row[1];
        rateStart = 4;
      } else if (row.length >= cubeColumns.length + 2 && isPercent(row[2])) {
        stat = row[0];
        scope = row[1];
        rateStart = 2;
      } else {
        continue;
      }

      const key = `${majorCategory}::${minorCategory}`;
      stats[currentRank][key] = stats[currentRank][key] || {
        major: majorCategory,
        minor: minorCategory,
        entries: []
      };

      const rates = {};
      cubeColumns.forEach((col, i) => {
        rates[col] = parsePercent(row[rateStart + i]);
      });

      stats[currentRank][key].entries.push({ stat, scope, rates });
    }
  }

  return stats;
}

function parseSpecialRules(html) {
  const $ = cheerio.load(html);
  const notes = [];
  $('span, td, div').each((_, el) => {
    const t = cellText($, el);
    if (t.startsWith('*') && t.length < 200) notes.push(t);
  });
  return [...new Set(notes)];
}

function omitCubeRates(data, omitIds = []) {
  if (!omitIds.length) return data;

  const omit = new Set(omitIds);
  const keptColumns = (data.meta.cubeColumns || []).filter((id) => !omit.has(id));
  const keptNames = (data.meta.cubeNames || []).filter((_, i) => !omit.has(data.meta.cubeColumns[i]));

  data.meta.cubeColumns = keptColumns;
  data.meta.cubeNames = keptNames;

  if (data.rankUp) {
    omit.forEach((id) => delete data.rankUp[id]);
  }

  if (data.lineRules) {
    omit.forEach((id) => delete data.lineRules[id]);
  }

  const stripRatesObject = (rates) => {
    if (!rates || typeof rates !== 'object') return;
    omit.forEach((id) => delete rates[id]);
  };

  const walkStatRates = (statRates) => {
    if (!statRates) return;
    Object.values(statRates).forEach((groups) => {
      Object.values(groups).forEach((group) => {
        group.entries?.forEach((entry) => stripRatesObject(entry.rates));
      });
    });
  };

  walkStatRates(data.statRates);

  return data;
}

function parsePage(page) {
  const htmlPath = path.join(ROOT, 'data', 'official-cube-rates', `event${page.id}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.warn(`Skip ${page.id}: missing ${htmlPath}`);
    return null;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  const allTables = [];
  $('table').each((_, t) => allTables.push(expandTable($, t)));

  let cubeNames = page.cubeNames;
  if (!cubeNames && allTables[0]) {
    const headerRow = allTables[0].find((r) => r.includes('道具名稱'));
    if (headerRow) {
      const idx = headerRow.indexOf('道具名稱');
      cubeNames = allTables[0]
        .slice(allTables[0].indexOf(headerRow) + 1)
        .map((r) => r[idx])
        .filter((n) => n && n.includes('方塊'));
    }
  }

  const rankUp = allTables[0] ? parseRankUpTable(allTables[0], cubeNames, page.cubeColumns) : null;
  const lineRules = {};

  // 8422 等頁面可能把 line rule 與 rankUp 合併在同一張表
  for (let i = 0; i < allTables.length; i++) {
    const rows = allTables[i];
    const hasLineRuleSection = rows.some((r) => r.some((c) => c.includes('第一排')));
    if (i > 0 || hasLineRuleSection) {
      Object.assign(lineRules, parseLineRankRules(rows));
    }
  }

  // 閃炫 / 結合特殊表
  const specialLineRules = {};
  for (const rows of allTables) {
    if (rows[0]?.[0] === '類別' && rows[0]?.[1] === '相同等級') {
      const slots = rows.slice(1).map((r) => ({
        slot: r[0],
        same: parsePercent(r[1]),
        lower: parsePercent(r[2]),
        setRate: r[3] ? parsePercent(r[3]) : null
      }));
      if (rows[0].length >= 4) {
        specialLineRules.union = slots;
      } else if (slots.length === 6) {
        specialLineRules.dazzling = slots;
      }
    }
  }

  const unionAddRules = buildUnionAddSpecialRules(lineRules);
  if (unionAddRules) {
    specialLineRules.unionAdd = unionAddRules;
  }

  // 最大 stat 表（含「裝備強化機率」）
  let statRates = null;
  let statCubeColumns = page.cubeColumns;
  for (const rows of allTables) {
    if (rows[0]?.includes('大分類') && rows[0]?.includes('屬性')) {
      const typeIdx = rows[0].indexOf('類型');
      if (typeIdx >= 0 && rows[0].length > typeIdx + 1) {
        const headerCount = rows[0].slice(typeIdx + 1).filter(Boolean).length;
        statCubeColumns = page.cubeColumns.slice(0, headerCount);
      }
      statRates = parseStatRatesTable(rows, statCubeColumns);
    }
  }

  return omitCubeRates({
    meta: {
      eventId: page.id,
      slug: page.slug,
      title: page.title,
      sourceUrl: `https://maplestory-event.beanfun.com/eventad/eventad?eventadid=${page.id}`,
      cubeColumns: page.cubeColumns,
      cubeNames: cubeNames || page.cubeNames,
      parsedAt: new Date().toISOString().slice(0, 10)
    },
    rankUp,
    lineRules,
    specialLineRules,
    statRates,
    notes: parseSpecialRules(html).slice(0, 20)
  }, page.omitCubeColumns || []);
}

function emitJs(page, data) {
  const content = `/**
 * ${data.meta.title}
 * 官方來源：${data.meta.sourceUrl}
 * 自動解析日期：${data.meta.parsedAt}
 * 請勿手動編輯；重新執行 scripts/parse-cube-rates.mjs 更新
 */
const CUBE_RATES_${page.id} = ${JSON.stringify(data, null, 2)};

if (typeof window !== 'undefined') {
  window.CUBE_RATES_${page.id} = CUBE_RATES_${page.id};
}
`;

  const outPath = path.join(OUT_DIR, `event${page.id}.js`);
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`Wrote ${outPath}`);
}

function emitIndex(pages) {
  const ids = pages.map((p) => p.id);
  const content = `/**
 * 方塊機率資料索引
 * 資料來自楓之谷官方機率公告
 */
const CUBE_RATE_EVENTS = {
${ids.map((id) => `  ${id}: typeof CUBE_RATES_${id} !== 'undefined' ? CUBE_RATES_${id} : null`).join(',\n')}
};

const CUBE_RATE_PAGES = [
${pages.map((p) => `  { id: ${p.id}, slug: '${p.slug}', title: '${p.title}' }`).join(',\n')}
];

function getCubeRateEvent(eventId) {
  return CUBE_RATE_EVENTS[eventId] || null;
}

function parseCubePercent(text) {
  if (text == null || text === '') return null;
  if (typeof text === 'number') return text;
  const m = String(text).match(/([\\d.]+)\\s*%/);
  return m ? Number(m[1]) / 100 : null;
}

if (typeof window !== 'undefined') {
  window.CUBE_RATE_EVENTS = CUBE_RATE_EVENTS;
  window.CUBE_RATE_PAGES = CUBE_RATE_PAGES;
  window.getCubeRateEvent = getCubeRateEvent;
  window.parseCubePercent = parseCubePercent;
}
`;

  fs.writeFileSync(path.join(OUT_DIR, 'index.js'), content, 'utf8');
  console.log('Wrote index.js');
}

// main
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const parsed = [];
for (const page of EVENT_PAGES) {
  const data = parsePage(page);
  if (data) {
    emitJs(page, data);
    parsed.push(page);
  }
}
emitIndex(parsed);
console.log('Done.', parsed.length, 'pages');
