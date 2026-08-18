import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ITEM_JS = path.join(ROOT, 'js', 'item.js');

if (typeof process.stdout?.setDefaultEncoding === 'function') {
  process.stdout.setDefaultEncoding('utf8');
}
if (typeof process.stderr?.setDefaultEncoding === 'function') {
  process.stderr.setDefaultEncoding('utf8');
}

const INFO_SCALAR_KEYS = new Set([
  'islot', 'vslot', 'reqJob', 'reqJob2', 'reqSpecJob', 'reqLevel', 'tuc',
  'attackSpeed', 'incSTR', 'incDEX', 'incINT', 'incLUK', 'incPAD', 'incMAD',
  'incPDD', 'incMDD', 'incMHP', 'incMMP', 'incSpeed', 'incJump', 'incMHPr', 'imdR', 'bdR', 'setItemID', 'sfx', 'afterImage',
  'exceptUpgrade', 'tradeBlock', 'notSale', 'equipTradeBlock', 'tradeAvailable',
  'bossReward', 'exItem', 'charmEXP', 'price', 'cash', 'noDrop', 'onlyEquip',
  'exceptToadsHammer', 'exceptTransmission', 'jokerToSetItem', 'undecomposable',
  'unsyntesizable', 'only', 'fixedGrade', 'specialGrade', 'fixedPotential', 'atlas'
]);

const INFO_FIELD_ORDER = [
  'wzPart', 'islot', 'vslot', 'reqJob', 'reqJob2', 'reqSpecJob', 'reqLevel',
  'incSTR', 'incDEX', 'incINT', 'incLUK', 'incPAD', 'incMAD', 'incPDD', 'incMDD', 'incMHP', 'incMMP', 'incSpeed', 'incJump', 'incMHPr',
  'tuc', 'atlas', 'attackSpeed', 'imdR', 'bdR', 'setItemID', 'sfx', 'afterImage',
  'exceptUpgrade', 'tradeBlock', 'notSale', 'onlyUpgrade', 'onlyUpgradeThousand'
];

function usage() {
  console.log(`用法:
  node scripts/import-equip-xml.mjs <xml 或資料夾...> [選項]

選項:
  --write              合併寫入 js/item.js（預設只印出片段）
  --inventory          寫入時追加到背包下一格空位
  --name <名稱>        單一 XML 時指定顯示名稱（預設用 ID）
  --icon <png>         複製圖片到 images/equip/{ID}.png（僅單一 XML）
  --icon-dir <資料夾>  批次複製 {itemId}.png
  --names <檔案>       名稱對照表（01215041=命運之劍 或空白分隔）

範例:
  node scripts/import-equip-xml.mjs ..\\Character.Weapon.01215041.img.xml --name 命運之劍 --write
  node scripts/import-equip-xml.mjs ..\\xmls --icon-dir ..\\pngs --names names.txt --write --inventory`);
}

function parseArgs(argv) {
  const files = [];
  let namesFile = null;
  let singleName = null;
  let iconPath = null;
  let iconDir = null;
  let write = false;
  let inventory = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--write') write = true;
    else if (arg === '--inventory') inventory = true;
    else if (arg === '--name') singleName = argv[++i];
    else if (arg === '--icon') iconPath = argv[++i];
    else if (arg === '--icon-dir') iconDir = argv[++i];
    else if (arg === '--names') namesFile = argv[++i];
    else if (arg === '--help' || arg === '-h') return { help: true };
    else if (!arg.startsWith('-')) files.push(stripQuotes(arg));
  }

  return { files, namesFile, singleName, iconPath, iconDir, write, inventory };
}

function stripQuotes(value) {
  return String(value ?? '').trim().replace(/^["']|["']$/g, '');
}

function isXmlFileName(name) {
  return /\.img\.xml$/i.test(name) || (/\.xml$/i.test(name) && /\d{7,8}/.test(name));
}

function expandXmlInputs(inputs) {
  const out = [];
  const seen = new Set();
  const push = (filePath) => {
    const resolved = path.resolve(filePath);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    out.push(resolved);
  };

  for (const raw of inputs) {
    const input = stripQuotes(raw);
    if (!input) continue;

    if (/[*?]/.test(input) && typeof fs.globSync === 'function') {
      const matches = fs.globSync(input, { windowsPathsNoEscape: true });
      matches.filter((f) => isXmlFileName(f)).forEach(push);
      continue;
    }

    const resolved = path.resolve(input);
    if (!fs.existsSync(resolved)) {
      throw new Error(`找不到檔案：${resolved}`);
    }
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      fs.readdirSync(resolved)
        .filter(isXmlFileName)
        .forEach((name) => push(path.join(resolved, name)));
      continue;
    }
    push(resolved);
  }

  return out;
}

function copyEquipIcon(itemId, srcPath) {
  const iconSrc = path.resolve(stripQuotes(srcPath));
  if (!fs.existsSync(iconSrc) || !fs.statSync(iconSrc).isFile()) {
    throw new Error(`找不到圖片：${iconSrc}`);
  }
  const equipDir = path.join(ROOT, 'images', 'equip');
  fs.mkdirSync(equipDir, { recursive: true });
  const dest = path.join(equipDir, `${itemId}.png`);
  fs.copyFileSync(iconSrc, dest);
  console.log(`已複製圖片 → images/equip/${itemId}.png`);
}

function loadNamesMap(filePath) {
  const map = new Map();
  if (!filePath || !fs.existsSync(filePath)) return map;

  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.match(/^(\d+)\s*=\s*(.+)$/);
    const sp = trimmed.match(/^(\d+)\s+(.+)$/);
    if (eq) map.set(eq[1], eq[2].trim());
    else if (sp) map.set(sp[1], sp[2].trim());
  }
  return map;
}

function normalizeItemId(raw) {
  const m = String(raw).match(/(\d{7,8})/);
  return m ? m[1].padStart(8, '0') : raw;
}

function extractItemIdFromXml(xml, filePath) {
  const root = xml.match(/<dir name="(\d+)\.img">/);
  if (root) return normalizeItemId(root[1]);
  const base = path.basename(filePath, '.img.xml');
  const m = base.match(/(\d{7,8})/);
  return m ? normalizeItemId(m[1]) : base;
}

function extractInfoBlock(xml) {
  const start = xml.indexOf('<dir name="info">');
  if (start === -1) return '';

  let depth = 0;
  let i = start;
  while (i < xml.length) {
    const open = xml.indexOf('<dir ', i);
    const close = xml.indexOf('</dir>', i);
    if (open !== -1 && (close === -1 || open < close)) {
      depth++;
      i = open + 5;
      continue;
    }
    if (close === -1) break;
    depth--;
    i = close + 6;
    if (depth === 0) return xml.slice(start, i);
  }
  return '';
}

function parseTagValue(tag) {
  const m = tag.match(/\bname="([^"]+)"\s+value="([^"]*)"/);
  if (!m) return null;
  return { name: m[1], value: m[2] };
}

function parseInfoFromBlock(block) {
  const info = {};
  const lines = block.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const dirOpen = line.match(/^<dir name="(onlyUpgrade|onlyUpgradeThousand)">$/);
    if (dirOpen) {
      const key = dirOpen[1];
      const values = [];
      i++;
      while (i < lines.length && !lines[i].includes('</dir>')) {
        const child = lines[i].trim();
        const val = child.match(/value="([^"]*)"/);
        if (val && (child.includes('<int32') || child.includes('<string'))) {
          const num = Number(val[1]);
          values.push(Number.isNaN(num) ? val[1] : num);
        }
        i++;
      }
      if (values.length) info[key] = values;
      continue;
    }

    if (!line.startsWith('<int32') && !line.startsWith('<int16') && !line.startsWith('<string')) continue;
    const parsed = parseTagValue(line);
    if (!parsed || !INFO_SCALAR_KEYS.has(parsed.name)) continue;

    if (line.startsWith('<string')) {
      info[parsed.name] = parsed.value;
    } else {
      const num = Number(parsed.value);
      info[parsed.name] = Number.isNaN(num) ? parsed.value : num;
    }
  }

  return info;
}

function detectWzPart(filePath) {
  const m = filePath.replace(/\\/g, '/').match(/Character\.([A-Za-z]+)\./);
  return m ? m[1] : '';
}

function parseEquipXml(filePath) {
  const xml = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const itemId = extractItemIdFromXml(xml, filePath);
  const block = extractInfoBlock(xml);
  if (!block) throw new Error(`${filePath}：找不到 info 節點`);
  const info = parseInfoFromBlock(block);
  info.wzPart = detectWzPart(filePath);
  if (!info.islot && !info.vslot) throw new Error(`${filePath}：info 缺少 islot/vslot`);
  return { itemId, info };
}

function formatInfoValue(key, value) {
  if (Array.isArray(value)) {
    if (value.length <= 6) return `[${value.join(', ')}]`;
    const chunks = [];
    for (let i = 0; i < value.length; i += 6) {
      chunks.push(`      ${value.slice(i, i + 6).join(', ')}`);
    }
    return `[\n${chunks.join(',\n')}\n    ]`;
  }
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
  return String(value);
}

function formatEntry(itemId, name, info) {
  const keys = [
    ...INFO_FIELD_ORDER.filter((k) => info[k] !== undefined && info[k] !== ''),
    ...Object.keys(info).filter((k) => !INFO_FIELD_ORDER.includes(k)).sort()
  ];
  const seen = new Set();
  const ordered = keys.filter((k) => {
    if (seen.has(k)) return false;
    seen.add(k);
    const v = info[k];
    if (v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });

  const body = ordered.map((k) => `    ${k}: ${formatInfoValue(k, info[k])}`).join(',\n');
  return `  '${itemId}': buildEquipFromWzInfo('${itemId}', '${name.replace(/'/g, "\\'")}', {\n${body}\n  })`;
}

function parseExistingDatabase(content) {
  const start = content.indexOf('const ITEM_DATABASE = {');
  const end = content.indexOf('\n};', start);
  if (start === -1 || end === -1) throw new Error('item.js 找不到 ITEM_DATABASE');
  return { start, end: end + 3, innerStart: start + 'const ITEM_DATABASE = {'.length };
}

function parseExistingIds(databaseInner) {
  const ids = new Set();
  for (const m of databaseInner.matchAll(/'(\d{8})'\s*:/g)) ids.add(m[1]);
  return ids;
}

function parseExistingInventory(content) {
  const slots = [];
  for (const m of content.matchAll(/playerInventory(?:Equip)?\[(\d+)\]\s*=\s*'(\d+)';/g)) {
    slots.push({ index: Number(m[1]), id: m[2] });
  }
  return slots;
}

function mergeDatabase(content, entries) {
  const { start, end, innerStart } = parseExistingDatabase(content);
  const inner = content.slice(innerStart, end - 2).trim();
  const byId = new Map();

  if (inner) {
    for (const m of inner.matchAll(/'(\d{8})':\s*buildEquipFromWzInfo[\s\S]*?\n  \}\)/g)) {
      byId.set(m[1], m[0]);
    }
  }

  for (const entry of entries) {
    byId.set(entry.itemId, entry.code);
  }

  const merged = [...byId.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, code]) => code)
    .join(',\n\n');

  const block = `const ITEM_DATABASE = {\n${merged}\n};`;
  return content.slice(0, start) + block + content.slice(end);
}

function mergeInventory(content, newIds) {
  const existing = parseExistingInventory(content);
  const occupiedIds = new Set(existing.map((s) => s.id));
  const toAdd = newIds.filter((id) => !occupiedIds.has(id));
  const slots = [...existing];

  for (const id of toAdd) {
    let index = 0;
    while (slots.some((s) => s.index === index)) index++;
    slots.push({ index, id });
  }

  slots.sort((a, b) => a.index - b.index);
  // 與現有 item.js 一致：透過 playerInventory 別名寫入裝備分頁
  const invLines = slots.map((s) => `playerInventory[${s.index}] = '${s.id}';`).join('\n');

  const marker = 'let playerInventoryEquip = new Array(INVENTORY_SLOT_COUNT).fill(null);';
  const idx = content.indexOf(marker);
  if (idx === -1) throw new Error('item.js 找不到 playerInventory');

  const afterMarker = content.slice(idx + marker.length);
  const letEnchantMatch = afterMarker.match(/\r?\n(?:\r?\n)?let currentEnchantItem\b/);
  if (!letEnchantMatch) throw new Error('item.js 找不到 currentEnchantItem');

  const letPos = idx + marker.length + letEnchantMatch.index + letEnchantMatch[0].indexOf('let currentEnchantItem');
  const middle = content.slice(idx + marker.length, letPos);

  // 保留 consume / state / 別名等宣告，只替換格子指派
  // 勿保留 DEFAULT_PLAYER_INVENTORY_*（必須在 currentEnchantItem 之後，否則會在賦值前被算成空陣列）
  const keptMiddle = middle
    .split(/\r?\n/)
    .filter((line) => !/^\s*playerInventory(?:Equip)?\[\d+\]\s*=/.test(line))
    .filter((line) => !/DEFAULT_PLAYER_INVENTORY_EQUIP_IDS|buildDefaultPlayerInventoryEquipIds|applyInitialDefaultEquipInventory/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '\n')
    .replace(/\n+$/, '\n');

  const head = content.slice(0, idx + marker.length);
  return `${head}${keptMiddle}\n${invLines}\n\n${content.slice(letPos)}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();
  if (!args.files.length) {
    usage();
    process.exit(1);
  }

  let xmlFiles;
  try {
    xmlFiles = expandXmlInputs(args.files);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
  if (!xmlFiles.length) {
    console.error('沒有找到可導入的 .img.xml');
    process.exit(1);
  }

  const namesMap = loadNamesMap(args.namesFile);
  const entries = [];
  const ids = [];

  for (const resolved of xmlFiles) {
    const { itemId, info } = parseEquipXml(resolved);
    let name = namesMap.get(itemId) || namesMap.get(itemId.replace(/^0+/, ''));
    if (!name && args.singleName && xmlFiles.length === 1) name = args.singleName;
    if (!name) name = itemId;

    const code = formatEntry(itemId, name, info);
    entries.push({ itemId, name, info, code });
    ids.push(itemId);
    console.log(`✓ ${path.basename(resolved)} → ${itemId} (${name})`);
  }

  console.log('\n--- 產生片段 ---\n');
  console.log(entries.map((e) => e.code).join(',\n\n'));

  if (!args.write) {
    console.log('\n（未寫入 item.js，加上 --write 才會合併）');
    return;
  }

  try {
    if (args.iconPath) {
      if (xmlFiles.length !== 1) {
        throw new Error('--icon 僅支援單一 XML，批次請用 --icon-dir');
      }
      copyEquipIcon(ids[0], args.iconPath);
    }
    if (args.iconDir) {
      const dir = path.resolve(stripQuotes(args.iconDir));
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        throw new Error(`找不到圖片資料夾：${dir}`);
      }
      ids.forEach((id) => {
        const src = path.join(dir, `${id}.png`);
        if (fs.existsSync(src)) copyEquipIcon(id, src);
        else console.warn(`略過圖片（找不到 ${id}.png）`);
      });
    }
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }

  let content = fs.readFileSync(ITEM_JS, 'utf8').replace(/^\uFEFF/, '');
  content = mergeDatabase(content, entries);
  if (args.inventory) content = mergeInventory(content, ids);
  fs.writeFileSync(ITEM_JS, content, 'utf8');
  console.log(`\n已寫入 ${ITEM_JS}${args.inventory ? '（含背包）' : ''}`);
}

main();
