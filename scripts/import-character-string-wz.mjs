/**
 * 讀取 HaRepacker / WzComparer 匯出的 Character.wz、String.wz（XML），
 * 對出裝備 info + 中文名稱，可選擇寫入 js/item.js 與 images/equip。
 *
 * 不讀加密的 .wz 本體；請先匯出成資料夾或 *.img.xml。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  ITEM_JS,
  parseEquipXml,
  formatEntry,
  mergeDatabase,
  normalizeItemId,
  isXmlFileName,
} from './import-equip-xml.mjs';

if (typeof process.stdout?.setDefaultEncoding === 'function') {
  process.stdout.setDefaultEncoding('utf8');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SKIP_PATH_PARTS = new Set([
  'hair', 'face', 'afterimage', 'tamingmob', 'emotion', 'caporigin',
  'weaponeffect', 'skillskin', 'bits', 'nicktag', 'damageskin',
  'dragon', 'mechanic', 'petequip',
]);

const DEFAULT_PARTS = [
  'Weapon', 'Cap', 'Coat', 'Longcoat', 'Pants', 'Shoes', 'Glove', 'Cape',
  'Shield', 'Accessory', 'Ring', 'Belt', 'Shoulder', 'Pocket', 'Totem',
  'Medal', 'Badge', 'Emblem', 'Heart', 'Android',
];

function usage() {
  console.log(`用法:
  node scripts/import-character-string-wz.mjs --character <Character.wz> --string <String.wz> [選項]

Character.wz / String.wz 請用 HaRepacker 或 WzComparer 匯出的 XML 資料夾
（裡面是 *.img.xml）。直接丟加密 .wz 會提示無法解析。

選項:
  --min-level <n>     最低 reqLevel（預設 0）
  --max-level <n>     最高 reqLevel（預設 300）
  --parts Cap,Weapon  只匯入這些 Character 子資料夾
  --include-cash      包含 cash=1 時裝（預設略過）
  --limit <n>         最多處理幾件（測試用）
  --extract-icons     從 XML 內嵌 PNG 寫到 images/equip/{id}.png 與 images/equipRaw/{id}.png
  --names-out <檔>    另外輸出 ID=名稱 對照表
  --write             合併寫入 js/item.js
  --dry-run           只統計／列出，不寫檔

範例:
  node scripts/import-character-string-wz.mjs --character D:\\\\wz\\\\Character.wz --string D:\\\\wz\\\\String.wz --max-level 100 --dry-run
  node scripts/import-character-string-wz.mjs --character D:\\\\wz\\\\Character.wz --string D:\\\\wz\\\\String.wz --min-level 1 --max-level 70 --extract-icons --write
`);
}

function parseArgs(argv) {
  const args = {
    character: null,
    string: null,
    minLevel: 0,
    maxLevel: 300,
    parts: null,
    includeCash: false,
    limit: 0,
    extractIcons: false,
    namesOut: null,
    write: false,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--character') args.character = next();
    else if (arg === '--string') args.string = next();
    else if (arg === '--min-level') args.minLevel = Number(next()) || 0;
    else if (arg === '--max-level') args.maxLevel = Number(next()) || 300;
    else if (arg === '--parts') args.parts = String(next() || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--include-cash') args.includeCash = true;
    else if (arg === '--limit') args.limit = Number(next()) || 0;
    else if (arg === '--extract-icons') args.extractIcons = true;
    else if (arg === '--names-out') args.namesOut = next();
    else if (arg === '--write') args.write = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (!arg.startsWith('-')) {
      if (!args.character) args.character = arg;
      else if (!args.string) args.string = arg;
    }
  }
  return args;
}

function isWzBinary(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  return buf.toString('ascii') === 'PKG1';
}

function resolveRoot(raw, label) {
  if (!raw) throw new Error(`請指定 ${label} 路徑`);
  const resolved = path.resolve(String(raw).replace(/^["']|["']$/g, ''));
  if (!fs.existsSync(resolved)) throw new Error(`找不到 ${label}：${resolved}`);
  if (fs.statSync(resolved).isFile()) {
    if (isWzBinary(resolved)) {
      throw new Error(
        `${label} 是加密的 .wz 本體，請先用 HaRepacker / WzComparer 匯出 XML 資料夾後再指定那個資料夾。`,
      );
    }
    return path.dirname(resolved);
  }
  return resolved;
}

function shouldSkipXmlPath(filePath, allowedParts) {
  const parts = filePath.replace(/\\/g, '/').split('/').map((p) => p.toLowerCase());
  if (parts.some((p) => SKIP_PATH_PARTS.has(p.replace(/\.wz$/i, '')))) return true;
  if (!allowedParts || !allowedParts.length) return false;
  const allow = new Set(allowedParts.map((p) => p.toLowerCase()));
  return !parts.some((p) => allow.has(p.replace(/\.wz$/i, '')));
}

function walkXmlFiles(rootDir, allowedParts) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const name = ent.name.toLowerCase().replace(/\.wz$/i, '');
        if (SKIP_PATH_PARTS.has(name)) continue;
        stack.push(full);
        continue;
      }
      if (!isXmlFileName(ent.name)) continue;
      if (shouldSkipXmlPath(full, allowedParts)) continue;
      out.push(full);
    }
  }
  return out;
}

function findEqpXml(stringRoot) {
  const preferred = [
    path.join(stringRoot, 'Eqp.img.xml'),
    path.join(stringRoot, 'String.Eqp.img.xml'),
    path.join(stringRoot, 'Eqp.img', 'Eqp.img.xml'),
  ];
  for (const p of preferred) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  const found = [];
  const stack = [stringRoot];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (/eqp.*\.img\.xml$/i.test(ent.name) || /^eqp\.img\.xml$/i.test(ent.name)) {
        found.push(full);
      }
    }
  }
  found.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  return found[0] || null;
}

function parseEqpNames(eqpXmlPath) {
  const map = new Map();
  const xml = fs.readFileSync(eqpXmlPath, 'utf8').replace(/^\uFEFF/, '');
  let depth = 0;
  const idAtDepth = [];
  const lines = xml.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    const open = line.match(/^<dir name="([^"]+)">/);
    if (open) {
      depth += 1;
      if (/^\d{4,8}$/.test(open[1])) idAtDepth[depth] = open[1];
      continue;
    }
    if (line.startsWith('</dir>')) {
      idAtDepth[depth] = undefined;
      depth = Math.max(0, depth - 1);
      continue;
    }
    const nameTag = line.match(/^<string name="name" value="([^"]*)"/);
    if (!nameTag) continue;
    let id = null;
    for (let d = depth; d >= 0; d--) {
      if (idAtDepth[d]) {
        id = idAtDepth[d];
        break;
      }
    }
    if (!id) continue;
    const padded = normalizeItemId(id);
    if (!map.has(padded)) map.set(padded, nameTag[1]);
    const stripped = String(Number(id));
    if (!map.has(stripped)) map.set(stripped, nameTag[1]);
  }
  return map;
}

function extractEmbeddedPng(xml, nodeName) {
  const re = new RegExp(`<png name="${nodeName}"[^>]*\\bvalue="([^"]+)"`, 'i');
  const m = xml.match(re);
  if (!m) return null;
  try {
    const buf = Buffer.from(m[1], 'base64');
    if (buf.length < 64) return null;
    if (buf[0] !== 0x89 || buf[1] !== 0x50) return null;
    return buf;
  } catch {
    return null;
  }
}

function writeEquipIcon(itemId, xml) {
  const iconBuf = extractEmbeddedPng(xml, 'icon') || extractEmbeddedPng(xml, 'iconRaw');
  const rawBuf = extractEmbeddedPng(xml, 'iconRaw') || extractEmbeddedPng(xml, 'icon');
  if (!iconBuf && !rawBuf) return false;
  const dir = path.join(ROOT, 'images', 'equip');
  const rawDir = path.join(ROOT, 'images', 'equipRaw');
  if (iconBuf) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${itemId}.png`), iconBuf);
  }
  if (rawBuf) {
    fs.mkdirSync(rawDir, { recursive: true });
    fs.writeFileSync(path.join(rawDir, `${itemId}.png`), rawBuf);
  }
  return true;
}

function lookupName(names, itemId) {
  return names.get(itemId)
    || names.get(itemId.replace(/^0+/, ''))
    || names.get(String(Number(itemId)))
    || itemId;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.character && !args.string)) {
    usage();
    if (!args.help && !args.character) process.exit(1);
    return;
  }

  let characterRoot;
  let stringRoot;
  try {
    characterRoot = resolveRoot(args.character, 'Character.wz');
    stringRoot = resolveRoot(args.string, 'String.wz');
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }

  const eqpXml = findEqpXml(stringRoot);
  if (!eqpXml) {
    console.error(`在 ${stringRoot} 找不到 Eqp.img.xml（String.wz 的裝備名稱表）`);
    process.exit(1);
  }
  console.log(`名稱表：${eqpXml}`);
  const names = parseEqpNames(eqpXml);
  console.log(`已讀取 ${names.size} 筆裝備名稱`);

  const allowedParts = args.parts && args.parts.length ? args.parts : DEFAULT_PARTS;
  const xmlFiles = walkXmlFiles(characterRoot, allowedParts);
  console.log(`找到 ${xmlFiles.length} 個裝備 XML`);

  const entries = [];
  const skipped = { cash: 0, level: 0, parse: 0, noInfo: 0 };
  let icons = 0;

  for (const filePath of xmlFiles) {
    if (args.limit && entries.length >= args.limit) break;
    let parsed;
    try {
      parsed = parseEquipXml(filePath);
    } catch {
      skipped.parse += 1;
      continue;
    }
    const { itemId, info } = parsed;
    if (!info.islot && !info.vslot) {
      skipped.noInfo += 1;
      continue;
    }
    if (!args.includeCash && Number(info.cash) === 1) {
      skipped.cash += 1;
      continue;
    }
    const lv = Number(info.reqLevel) || 0;
    if (lv < args.minLevel || lv > args.maxLevel) {
      skipped.level += 1;
      continue;
    }
    const name = lookupName(names, itemId);
    const code = formatEntry(itemId, name, info);
    entries.push({ itemId, name, info, code, filePath });

    if (args.extractIcons && !args.dryRun) {
      try {
        const xml = fs.readFileSync(filePath, 'utf8');
        if (writeEquipIcon(itemId, xml)) icons += 1;
      } catch { /* ignore */ }
    }
  }

  console.log(`符合條件：${entries.length} 件（略過 cash ${skipped.cash}、等級 ${skipped.level}、解析失敗 ${skipped.parse}）`);
  if (args.extractIcons) console.log(`寫入圖示：${icons} 張`);

  if (args.namesOut && !args.dryRun) {
    const lines = entries
      .map((e) => `${e.itemId}=${e.name}`)
      .sort();
    fs.writeFileSync(path.resolve(args.namesOut), `${lines.join('\n')}\n`, 'utf8');
    console.log(`已寫名稱表：${args.namesOut}`);
  }

  if (args.dryRun) {
    const sample = entries.slice(0, 15);
    for (const e of sample) {
      console.log(`  ${e.itemId}  Lv${e.info.reqLevel || 0}  ${e.name}`);
    }
    if (entries.length > sample.length) console.log(`  …其餘 ${entries.length - sample.length} 件`);
    return;
  }

  if (!args.write) {
    console.log('\n（未寫入 item.js，加上 --write 才會合併）');
    console.log(entries.slice(0, 3).map((e) => e.code).join(',\n\n'));
    return;
  }

  let content = fs.readFileSync(ITEM_JS, 'utf8').replace(/^\uFEFF/, '');
  content = mergeDatabase(content, entries);
  fs.writeFileSync(ITEM_JS, content, 'utf8');
  console.log(`已寫入 ${ITEM_JS}（${entries.length} 件）`);
}

main();
