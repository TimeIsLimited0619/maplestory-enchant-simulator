/**
 * 從 MapleStory.io 匯入裝備數值與圖示到本地。
 * 遊戲執行時不打 API；本腳本只負責離線快取。
 *
 * 範例：
 *   node scripts/import-maplestory-io.mjs --min-level 1 --max-level 100
 *   node scripts/import-maplestory-io.mjs --min-level 1 --max-level 100 --full
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_JS = path.join(ROOT, 'js', 'generatedEquips.js');
const ICON_DIR = path.join(ROOT, 'images', 'equip');
const ICON_RAW_DIR = path.join(ROOT, 'images', 'equipRaw');
const CACHE_DIR = path.join(ROOT, 'data', 'msio', 'cache');
const LIST_CACHE = path.join(CACHE_DIR, 'list.json');

const DEFAULT_REGION = 'TWMS';
const DEFAULT_VERSION = '250';
const SKIP_SUB = new Set(['Hair', 'Face', 'Taming', 'Taming Mob', 'Bit']);
const SKIP_CAT = new Set(['Hair', 'Face', 'Character']);

const SUB_TO_WZPART = {
  Hat: 'Cap',
  Cap: 'Cap',
  Top: 'Coat',
  Coat: 'Coat',
  Bottom: 'Pants',
  Pants: 'Pants',
  Overall: 'Longcoat',
  'Overall Armor': 'Longcoat',
  Shoes: 'Shoes',
  Glove: 'Glove',
  Gloves: 'Glove',
  Cape: 'Cape',
  Shield: 'Shield',
  Ring: 'Ring',
  Pendant: 'Pendant',
  Belt: 'Belt',
  Shoulder: 'Shoulder',
  Earrings: 'Earrings',
  'Eye Accessory': 'Eye',
  'Face Accessory': 'Face',
  'Pocket Item': 'Pocket',
  Pocket: 'Pocket',
  Emblem: 'Emblem',
  Medal: 'Medal',
  Badge: 'Badge',
  Android: 'Android',
  Heart: 'Heart',
  'Mechanical Heart': 'Heart',
  Totem: 'Totem',
};

function parseArgs(argv) {
  const args = {
    region: DEFAULT_REGION,
    version: DEFAULT_VERSION,
    minLevel: 1,
    maxLevel: 100,
    concurrency: 3,
    perBucket: 2,
    limit: 0,
    newOnly: false,
    full: false,
    includeCash: false,
    skipIcons: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const n = () => argv[++i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--region') args.region = n();
    else if (a === '--version') args.version = n();
    else if (a === '--min-level') args.minLevel = Number(n()) || 0;
    else if (a === '--max-level') args.maxLevel = Number(n()) || 300;
    else if (a === '--concurrency') args.concurrency = Math.max(1, Number(n()) || 3);
    else if (a === '--per-bucket') args.perBucket = Math.max(1, Number(n()) || 2);
    else if (a === '--limit') args.limit = Math.max(0, Number(n()) || 0);
    else if (a === '--new-only') args.newOnly = true;
    else if (a === '--full') args.full = true;
    else if (a === '--include-cash') args.includeCash = true;
    else if (a === '--skip-icons') args.skipIcons = true;
  }
  return args;
}

function usage() {
  console.log(`用法:
  node scripts/import-maplestory-io.mjs [選項]

  --min-level / --max-level   等級區間（預設 1~100）
  --per-bucket <n>            每個「十等帶+部位」最多 n 件（預設 2，避免一次抓幾千件）
  --limit <n>                 最多抓 n 件
  --new-only                  跳過資料庫裡已有的 ID
  --full                      不抽樣，該區間全部非時裝都抓
  --region / --version        預設 TWMS / 250
  --concurrency <n>           同時請求數（預設 3）
  --skip-icons                不下載圖示
`);
}

function padId(id) {
  return String(id).padStart(8, '0');
}

function apiBase(args) {
  return `https://maplestory.io/api/${args.region}/${args.version}`;
}

async function fetchJson(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'maplestory-enchant-simulator-importer' },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      last = err;
      await sleep(800 * (i + 1));
    }
  }
  throw last;
}

async function fetchBuffer(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'maplestory-enchant-simulator-importer' },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      last = err;
      await sleep(600 * (i + 1));
    }
  }
  throw last;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slimMeta(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('empty item json');
  const m = raw.metaInfo || {};
  const drop = new Set(['icon', 'iconRaw', 'iconOrigin', 'iconRawOrigin']);
  const meta = {};
  for (const [k, v] of Object.entries(m)) {
    if (drop.has(k)) continue;
    meta[k] = v;
  }
  return {
    id: raw.id,
    name: raw.description?.name || String(raw.id),
    equipGroup: raw.equipGroup || '',
    typeInfo: raw.typeInfo || {},
    metaInfo: meta,
  };
}

function toInfo(slim) {
  const m = slim.metaInfo || {};
  const type = slim.typeInfo || {};
  const islot = Array.isArray(m.islots) ? m.islots[0] : m.islot;
  const vslots = Array.isArray(m.vslots) ? m.vslots.join('') : (m.vslot || islot);
  const wzPart = slim.equipGroup
    || SUB_TO_WZPART[type.subCategory]
    || SUB_TO_WZPART[type.category]
    || '';
  const info = {
    wzPart,
    islot,
    vslot: vslots,
    reqJob: Number(m.reqJob) || 0,
    reqLevel: Number(m.reqLevel ?? m.reqLevelEquip) || 0,
    tuc: Number(m.tuc) || 0,
  };
  const copyNum = [
    'incSTR', 'incDEX', 'incINT', 'incLUK', 'incPAD', 'incMAD',
    'incPDD', 'incMDD', 'incMHP', 'incMMP', 'incSpeed', 'incJump', 'incMHPr',
    'imdR', 'bdR', 'setItemID', 'attackSpeed', 'charmEXP', 'price', 'tradeAvailable',
    'accountSharable', 'atlas',
  ];
  for (const k of copyNum) {
    if (m[k] != null && m[k] !== 0 && m[k] !== false) info[k] = m[k];
  }
  if (Number(m.reqLevel) === 0 && Number(m.reqLevelEquip) > 0) {
    info.reqLevel = Number(m.reqLevelEquip);
  }
  const flags = [
    'cash', 'exceptUpgrade', 'tradeBlock', 'notSale', 'equipTradeBlock',
    'bossReward', 'exItem', 'onlyEquip',
  ];
  for (const k of flags) {
    if (m[k]) info[k] = m[k] === true || m[k] === 1 ? 1 : m[k];
  }
  return info;
}

function isWearableListRow(row, args) {
  if (!row || row.id == null) return false;
  if (!args.includeCash && row.isCash) return false;
  const lv = Number(row.requiredLevel) || 0;
  if (lv < args.minLevel || lv > args.maxLevel) return false;
  const cat = row.typeInfo?.category || '';
  const sub = row.typeInfo?.subCategory || '';
  if (SKIP_CAT.has(cat) || SKIP_SUB.has(sub)) return false;
  if (row.typeInfo?.overallCategory && row.typeInfo.overallCategory !== 'Equip') return false;
  return true;
}

function sampleRows(rows, perBucket) {
  const buckets = new Map();
  for (const row of rows) {
    const lv = Number(row.requiredLevel) || 0;
    const band = Math.floor(lv / 10) * 10;
    const sub = row.typeInfo?.subCategory || 'Other';
    const key = `${band}:${sub}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  const out = [];
  for (const list of buckets.values()) {
    list.sort((a, b) => a.id - b.id);
    out.push(...list.slice(0, perBucket));
  }
  return out.sort((a, b) => a.id - b.id);
}

function pickSpreadRows(rows, limit) {
  if (!(limit > 0) || rows.length <= limit) return rows;
  const buckets = new Map();
  for (const row of rows) {
    const sub = row.typeInfo?.subCategory || 'Other';
    if (!buckets.has(sub)) buckets.set(sub, []);
    buckets.get(sub).push(row);
  }
  for (const list of buckets.values()) list.sort((a, b) => a.id - b.id);
  const keys = [...buckets.keys()];
  const out = [];
  let i = 0;
  while (out.length < limit) {
    let added = false;
    for (const key of keys) {
      const list = buckets.get(key);
      if (i < list.length) {
        out.push(list[i]);
        added = true;
        if (out.length >= limit) break;
      }
    }
    if (!added) break;
    i += 1;
  }
  return out.sort((a, b) => a.id - b.id);
}

async function loadList(args) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const url = `${apiBase(args)}/item?overallCategoryFilter=Equip`;
  if (fs.existsSync(LIST_CACHE)) {
    const age = Date.now() - fs.statSync(LIST_CACHE).mtimeMs;
    if (age < 24 * 60 * 60 * 1000) {
      console.log('使用快取清單 data/msio/cache/list.json');
      return JSON.parse(fs.readFileSync(LIST_CACHE, 'utf8'));
    }
  }
  console.log(`下載清單 ${url}`);
  const list = await fetchJson(url);
  fs.writeFileSync(LIST_CACHE, JSON.stringify(list), 'utf8');
  return list;
}

async function loadSlimItem(args, numericId) {
  const file = path.join(CACHE_DIR, 'items', `${numericId}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const raw = await fetchJson(`${apiBase(args)}/item/${numericId}`);
  const slim = slimMeta(raw);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(slim), 'utf8');
  return slim;
}

async function mapPool(items, concurrency, worker) {
  let i = 0;
  const results = new Array(items.length);
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

function loadExistingRecords() {
  if (!fs.existsSync(OUT_JS)) return [];
  const text = fs.readFileSync(OUT_JS, 'utf8');
  const m = text.match(/GENERATED_EQUIP_RECORDS = (\[[\s\S]*?\]);/);
  if (!m) return [];
  try {
    return JSON.parse(m[1]);
  } catch (_) {
    return [];
  }
}

function mergeRecords(existing, incoming) {
  const byId = new Map();
  (existing || []).forEach((row) => {
    if (row?.id) byId.set(row.id, row);
  });
  (incoming || []).forEach((row) => {
    if (row?.id) byId.set(row.id, row);
  });
  return [...byId.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function writeGeneratedJs(records) {
  const body = JSON.stringify(records, null, 0);
  const js = `/**
 * 由 scripts/import-maplestory-io.mjs 產生。不要手改。
 * 執行期由 generatedEquipLoader.js 註冊進 ITEM_DATABASE。
 */
const GENERATED_EQUIP_RECORDS = ${body};

if (typeof window !== 'undefined') window.GENERATED_EQUIP_RECORDS = GENERATED_EQUIP_RECORDS;
if (typeof module !== 'undefined' && module.exports) module.exports = GENERATED_EQUIP_RECORDS;
`;
  fs.writeFileSync(OUT_JS, js, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const existing = loadExistingRecords();
  const haveIds = new Set(existing.map((row) => String(Number(row.id))));
  const list = await loadList(args);
  let filtered = (Array.isArray(list) ? list : []).filter((row) => isWearableListRow(row, args));
  if (args.newOnly) {
    filtered = filtered.filter((row) => !haveIds.has(String(row.id)));
  }
  let targets = (args.full || args.newOnly)
    ? filtered
    : sampleRows(filtered, args.perBucket);
  if (args.limit > 0) targets = pickSpreadRows(targets, args.limit);
  console.log(`清單 ${Array.isArray(list) ? list.length : 0} → 過濾 ${filtered.length} → 本次 ${targets.length} 件`);

  let ok = 0;
  let fail = 0;
  const records = [];

  await mapPool(targets, args.concurrency, async (row, idx) => {
    const id = padId(row.id);
    try {
      const slim = await loadSlimItem(args, row.id);
      const info = toInfo(slim);
      if (!info.islot) {
        fail += 1;
        return;
      }
      records.push({
        id,
        name: slim.name || row.name || id,
        info,
      });
      if (!args.skipIcons) {
        const dest = path.join(ICON_DIR, `${id}.png`);
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(ICON_DIR, { recursive: true });
          const buf = await fetchBuffer(`${apiBase(args)}/item/${row.id}/icon`);
          if (buf[0] === 0x89 && buf[1] === 0x50) fs.writeFileSync(dest, buf);
        }
        const rawDest = path.join(ICON_RAW_DIR, `${id}.png`);
        if (!fs.existsSync(rawDest)) {
          fs.mkdirSync(ICON_RAW_DIR, { recursive: true });
          try {
            const rawBuf = await fetchBuffer(`${apiBase(args)}/item/${row.id}/iconRaw`);
            if (rawBuf[0] === 0x89 && rawBuf[1] === 0x50) fs.writeFileSync(rawDest, rawBuf);
            else if (fs.existsSync(dest)) fs.copyFileSync(dest, rawDest);
          } catch (_) {
            if (fs.existsSync(dest)) fs.copyFileSync(dest, rawDest);
          }
        }
      }
      ok += 1;
      if ((idx + 1) % 20 === 0 || idx === targets.length - 1) {
        console.log(`進度 ${idx + 1}/${targets.length}（成功 ${ok} 失敗 ${fail}）`);
      }
    } catch (err) {
      fail += 1;
      console.warn(`略過 ${row.id}: ${err.message || err}`);
    }
  });

  records.sort((a, b) => a.id.localeCompare(b.id));
  const merged = mergeRecords(existing, records);
  writeGeneratedJs(merged);
  console.log(`完成：本次 ${records.length} 件，合併後 ${merged.length} 件 → js/generatedEquips.js`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
