/**
 * 掃 wz-xml/character/{部位} 的裝備 XML，對 wz-xml/string 的 Eqp 名稱，
 * 寫入 js/wzImportedEquips.js、images/equip/{id}.png、images/equipRaw/{id}.png。
 *
 * 只匯入裝備目錄／背包圖示。紙娃娃請跑 npm run import:paperdoll；
 * 怪物請跑 npm run import:mob。裝備＋紙娃娃：npm run import:gear
 *
 *   npm run import:wz
 *   node scripts/import-wz-xml.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { outlinkEquipId, outlinkWzPart } from './wz-equip-outlink.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WZ_ROOT = path.join(ROOT, 'wz-xml');
const CHAR_ROOT = path.join(WZ_ROOT, 'character');
const STRING_ROOT = path.join(WZ_ROOT, 'string');
const OUT_JS = path.join(ROOT, 'js', 'wzImportedEquips.js');
const ICON_DIR = path.join(ROOT, 'images', 'equip');
const ICON_RAW_DIR = path.join(ROOT, 'images', 'equipRaw');

const FOLDER_TO_WZPART = {
  weapon: 'Weapon',
  cap: 'Cap',
  coat: 'Coat',
  longcoat: 'Longcoat',
  pants: 'Pants',
  shoes: 'Shoes',
  glove: 'Glove',
  cape: 'Cape',
  shield: 'Shield',
  accessory: 'Accessory',
  ring: 'Ring',
  belt: 'Belt',
  shoulder: 'Shoulder',
  pocket: 'Pocket',
  totem: 'Totem',
  medal: 'Medal',
  badge: 'Badge',
  emblem: 'Emblem',
  heart: 'Heart',
  android: 'Android',
};

const WZPART_TO_FOLDER = Object.fromEntries(
  Object.entries(FOLDER_TO_WZPART).map(([folder, part]) => [part.toLowerCase(), folder]),
);

/** WZ info 欄位 → buildEquipFromWzInfo 使用的鍵 */
const INFO_KEY_MAP = {
  islot: 'islot',
  vslot: 'vslot',
  reqJob: 'reqJob',
  reqJob2: 'reqJob2',
  reqSpecJob: 'reqSpecJob',
  reqLevel: 'reqLevel',
  tuc: 'tuc',
  incSTR: 'incSTR',
  incDEX: 'incDEX',
  incINT: 'incINT',
  incLUK: 'incLUK',
  incPAD: 'incPAD',
  incMAD: 'incMAD',
  incPDD: 'incPDD',
  incMDD: 'incMDD',
  incMHP: 'incMHP',
  incMMP: 'incMMP',
  incSpeed: 'incSpeed',
  incJump: 'incJump',
  incMHPr: 'incMHPr',
  attackSpeed: 'attackSpeed',
  imdR: 'imdR',
  bdR: 'bdR',
  setItemID: 'setItemID',
  sfx: 'sfx',
  afterImage: 'afterImage',
  cash: 'cash',
  tradeBlock: 'tradeBlock',
  notSale: 'notSale',
  equipTradeBlock: 'equipTradeBlock',
  tradeAvailable: 'tradeAvailable',
  bossReward: 'bossReward',
  exItem: 'exItem',
  charmEXP: 'charmEXP',
  exceptUpgrade: 'exceptUpgrade',
  onlyEquip: 'onlyEquip',
  jokerToSetItem: 'jokerToSetItem',
  price: 'price',
};

function parseArgs(argv) {
  const args = { dryRun: false, includeCash: false, help: false };
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--include-cash') args.includeCash = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function padId(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(8, '0').slice(-8);
}

function isCanvasFileName(name) {
  return /_canvas/i.test(String(name || ''));
}

function isEquipFileName(name) {
  const n = String(name || '').toLowerCase();
  if (n.startsWith('.')) return false;
  if (n.endsWith('.png') || n === '.gitkeep') return false;
  if (isCanvasFileName(n)) return false;
  return /\.img(\.xml)?$/i.test(n) || /\.xml$/i.test(n);
}

function idFromFileName(name) {
  const m = String(name).match(/(\d{7,8})/);
  return m ? padId(m[1]) : '';
}

function extractNamedDir(xml, dirName) {
  const start = xml.search(new RegExp(`<(?:img|dir) name="${dirName}"(?:\\.img)?>`));
  const alt = xml.search(new RegExp(`<(?:img|dir) name="${dirName}">`));
  const i = start >= 0 ? start : alt;
  if (i < 0) return '';
  const openTagEnd = xml.indexOf('>', i);
  if (openTagEnd < 0) return '';
  let depth = 1;
  let p = openTagEnd + 1;
  while (p < xml.length && depth > 0) {
    const nextOpen = xml.slice(p).search(/<(?:img|dir) /);
    const nextClose = xml.slice(p).search(/<\/(?:img|dir)>/);
    if (nextClose < 0) break;
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      p += nextOpen + 1;
    } else {
      depth -= 1;
      if (depth === 0) return xml.slice(i, p + nextClose + xml.slice(p).match(/<\/(?:img|dir)>/)[0].length);
      p += nextClose + 1;
    }
  }
  return '';
}

function parseInfo(xml) {
  const block = extractNamedDir(xml, 'info');
  if (!block) throw new Error('找不到 info');
  const info = {};
  const re = /<(?:int32|int16|int8|short|int|string|uol)\s+name="([^"]+)"\s+value="([^"]*)"/gi;
  let m;
  while ((m = re.exec(block))) {
    const mapped = INFO_KEY_MAP[m[1]];
    if (!mapped) continue;
    if (m[0].toLowerCase().includes('<string') || m[0].toLowerCase().includes('<uol')) {
      info[mapped] = m[2];
    } else {
      const n = Number(m[2]);
      info[mapped] = Number.isNaN(n) ? m[2] : n;
    }
  }
  if (!info.islot && !info.vslot) throw new Error('info 缺少 islot/vslot');
  return info;
}

function extractPngBase64(xml, pngName) {
  const re = new RegExp(`<png name="${pngName}"[^>]*\\bvalue="([^"]+)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

function decodePng(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 32 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return buf;
}

function findCanvasFile(folderDir, itemId, wzPart) {
  const names = [
    `Character.${wzPart}._Canvas.${itemId}.img.xml`,
    `Character.${wzPart}._Canvas.${itemId}.img`,
    `${itemId}.img.xml`,
    `${itemId}.img`,
  ];
  const dirs = [
    folderDir,
    path.join(folderDir, '_canvas'),
    path.join(folderDir, '_Canvas'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const name of names) {
      const p = path.join(dir, name);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }
    for (const name of fs.readdirSync(dir)) {
      if (!isCanvasFileName(name) && path.basename(dir).toLowerCase() !== '_canvas') continue;
      if (idFromFileName(name) === itemId && isEquipFileName(name) === false && /\.(img\.xml|img|xml)$/i.test(name)) {
        return path.join(dir, name);
      }
      if (isCanvasFileName(name) && idFromFileName(name) === itemId) {
        return path.join(dir, name);
      }
    }
  }
  return null;
}

function extractPngOutlink(xml, pngName) {
  const infoBlock = extractNamedDir(xml, 'info');
  if (!infoBlock) return '';
  const re = new RegExp(`<png name="${pngName}"[\\s\\S]*?<string name="_outlink" value="([^"]+)"`, 'i');
  const m = infoBlock.match(re);
  return m ? m[1] : '';
}

function folderForWzPart(wzPart) {
  const folder = WZPART_TO_FOLDER[String(wzPart || '').toLowerCase()];
  return folder ? path.join(CHAR_ROOT, folder) : null;
}

function loadCanvasXml(linkId, wzPart, cache) {
  const key = `${wzPart}:${linkId}`;
  if (cache.has(key)) return cache.get(key);
  const folderDir = folderForWzPart(wzPart);
  let xml = null;
  if (folderDir) {
    const canvasPath = findCanvasFile(folderDir, linkId, wzPart);
    if (canvasPath) {
      xml = fs.readFileSync(canvasPath, 'utf8').replace(/^\uFEFF/, '');
    }
  }
  cache.set(key, xml);
  return xml;
}

function pngFromXml(xml, pngName) {
  const buf = decodePng(extractPngBase64(xml, pngName));
  if (buf && buf.length >= 200) return buf;
  return buf;
}

function resolveNamedPng(xml, canvasXml, pngName, opts = {}) {
  let buf = pngFromXml(xml, pngName);
  if (buf && buf.length >= 200) return buf;
  if (canvasXml) {
    buf = pngFromXml(canvasXml, pngName) || buf;
    if (buf && buf.length >= 200) return buf;
  }

  const outlink = extractPngOutlink(xml, pngName);
  if (!outlink) return buf && buf.length >= 200 ? buf : null;

  const linkId = outlinkEquipId(outlink);
  const linkPart = outlinkWzPart(outlink) || opts.wzPart || '';
  if (!linkId) return buf && buf.length >= 200 ? buf : null;

  const selfId = opts.itemId || '';
  const crossItem = linkId !== selfId;
  if (crossItem) {
    opts.onCrossRef?.(linkId, pngName);
  }
  if (crossItem || !canvasXml) {
    const crossCanvas = loadCanvasXml(linkId, linkPart, opts.canvasCache || new Map());
    if (crossCanvas) {
      const crossBuf = pngFromXml(crossCanvas, pngName);
      if (crossBuf && crossBuf.length >= 200) return crossBuf;
    }
  }
  return buf && buf.length >= 200 ? buf : null;
}

function writeIcon(itemId, xml, folderDir, wzPart, opts = {}) {
  const linked = /_outlink|_inlink/i.test(xml);
  let canvasXml = null;
  let fromCanvas = false;
  const canvasPath = findCanvasFile(folderDir, itemId, wzPart);
  if (canvasPath) {
    canvasXml = fs.readFileSync(canvasPath, 'utf8').replace(/^\uFEFF/, '');
    fromCanvas = true;
  }

  const resolveOpts = {
    itemId,
    wzPart,
    canvasCache: opts.canvasCache,
    onCrossRef: opts.onCrossRef,
  };

  // UI 用：優先 icon，沒有才用 iconRaw
  let iconBuf = resolveNamedPng(xml, canvasXml, 'icon', resolveOpts)
    || resolveNamedPng(xml, canvasXml, 'iconRaw', resolveOpts);
  // 掉落用：優先 iconRaw，沒有才用 icon
  let rawBuf = resolveNamedPng(xml, canvasXml, 'iconRaw', resolveOpts)
    || resolveNamedPng(xml, canvasXml, 'icon', resolveOpts);

  if (!iconBuf && !rawBuf) return { ok: false, linked, fromCanvas };

  if (iconBuf) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
    fs.writeFileSync(path.join(ICON_DIR, `${itemId}.png`), iconBuf);
  }
  if (rawBuf) {
    fs.mkdirSync(ICON_RAW_DIR, { recursive: true });
    fs.writeFileSync(path.join(ICON_RAW_DIR, `${itemId}.png`), rawBuf);
  }
  const used = iconBuf || rawBuf;
  return { ok: true, tiny: used.length < 200, linked, fromCanvas, wroteRaw: !!rawBuf };
}

function findEqpFile() {
  const names = [
    'String.Eqp.img.xml',
    'String.Eqp.img',
    'Eqp.img.xml',
    'Eqp.img',
  ];
  for (const n of names) {
    const p = path.join(STRING_ROOT, n);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  if (!fs.existsSync(STRING_ROOT)) return null;
  const found = fs.readdirSync(STRING_ROOT).find((n) => /eqp/i.test(n) && isEquipFileName(n));
  return found ? path.join(STRING_ROOT, found) : null;
}

function parseEqpNames(eqpPath) {
  const map = new Map();
  const xml = fs.readFileSync(eqpPath, 'utf8').replace(/^\uFEFF/, '');
  let depth = 0;
  const idAtDepth = [];
  for (const raw of xml.split(/\r?\n/)) {
    const line = raw.trim();
    const open = line.match(/^<(?:img|dir) name="([^"]+)">/);
    if (open) {
      depth += 1;
      const id = open[1].replace(/\.img$/i, '');
      if (/^\d{4,8}$/.test(id)) idAtDepth[depth] = id;
      continue;
    }
    if (/^<\/(?:img|dir)>/.test(line)) {
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
    const padded = padId(id);
    if (!map.has(padded)) map.set(padded, nameTag[1]);
  }
  return map;
}

function lookupName(names, itemId) {
  return names.get(itemId)
    || names.get(itemId.replace(/^0+/, ''))
    || names.get(String(Number(itemId)))
    || null;
}

function listEquipFiles() {
  const out = [];
  if (!fs.existsSync(CHAR_ROOT)) return out;
  for (const folder of fs.readdirSync(CHAR_ROOT)) {
    const dir = path.join(CHAR_ROOT, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    const wzPart = FOLDER_TO_WZPART[folder.toLowerCase()];
    if (!wzPart) {
      console.warn(`略過未知部位資料夾：character/${folder}`);
      continue;
    }
    for (const name of fs.readdirSync(dir)) {
      if (!isEquipFileName(name)) continue;
      out.push({ filePath: path.join(dir, name), wzPart, folder });
    }
  }
  return out.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

function writeOutJs(records) {
  const body = JSON.stringify(records, null, 0);
  const js = `/**
 * 由 scripts/import-wz-xml.mjs 從 wz-xml/ 產生。不要手改。
 */
const WZ_IMPORTED_EQUIP_RECORDS = ${body};
const WZ_IMPORTED_EQUIP_IDS = Object.freeze(WZ_IMPORTED_EQUIP_RECORDS.map((row) => row.id));

if (typeof window !== 'undefined') {
  window.WZ_IMPORTED_EQUIP_RECORDS = WZ_IMPORTED_EQUIP_RECORDS;
  window.WZ_IMPORTED_EQUIP_IDS = WZ_IMPORTED_EQUIP_IDS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WZ_IMPORTED_EQUIP_RECORDS, WZ_IMPORTED_EQUIP_IDS };
}
`;
  fs.writeFileSync(OUT_JS, js, 'utf8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('用法: node scripts/import-wz-xml.mjs [--dry-run] [--include-cash]');
    console.log('只匯入裝備目錄與背包圖示。紙娃娃：npm run import:paperdoll；怪物：npm run import:mob');
    return;
  }

  const eqpPath = findEqpFile();
  if (!eqpPath) {
    console.error(`找不到名稱表，請放到 ${STRING_ROOT}（String.Eqp.img.xml）`);
    process.exit(1);
  }
  const names = parseEqpNames(eqpPath);
  console.log(`名稱表：${path.relative(ROOT, eqpPath)}（${names.size} 筆）`);

  const files = listEquipFiles();
  if (!files.length) {
    console.warn(`在 ${path.relative(ROOT, CHAR_ROOT)} 沒有裝備 XML。紙娃娃請跑 npm run import:paperdoll，怪物請跑 npm run import:mob。`);
    return;
  }

  const records = [];
  const missingNames = [];
  const noIcon = [];
  const linkedIcon = [];
  const crossIconRefs = Object.create(null);
  const canvasCache = new Map();
  let skippedCash = 0;

  function noteCrossIconRef(fromId, toId, pngName) {
    if (!crossIconRefs[fromId]) crossIconRefs[fromId] = Object.create(null);
    crossIconRefs[fromId][toId] = crossIconRefs[fromId][toId] || new Set();
    crossIconRefs[fromId][toId].add(pngName);
  }

  for (const { filePath, wzPart } of files) {
    const xml = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const itemId = idFromFileName(path.basename(filePath));
    let info;
    try {
      info = parseInfo(xml);
    } catch (err) {
      console.warn(`略過 ${path.basename(filePath)}：${err.message}`);
      continue;
    }
    info.wzPart = wzPart;
    if (!args.includeCash && Number(info.cash) === 1) {
      skippedCash += 1;
      continue;
    }
    const name = lookupName(names, itemId);
    if (!name) missingNames.push(itemId);
    const folderDir = path.dirname(filePath);
    const icon = args.dryRun ? { ok: false } : writeIcon(itemId, xml, folderDir, wzPart, {
      canvasCache,
      onCrossRef: (toId, pngName) => noteCrossIconRef(itemId, toId, pngName),
    });
    if (!icon.ok) noIcon.push(itemId);
    else if (icon.tiny && icon.linked && !icon.fromCanvas) linkedIcon.push(itemId);

    records.push({
      id: itemId,
      name: name || itemId,
      info,
    });
    console.log(`  ${itemId}  ${name || '(無名稱)'}  Lv${info.reqLevel || 0}  ${wzPart}`);
  }

  console.log(`符合：${records.length} 件（略過時裝 ${skippedCash}）`);
  if (missingNames.length) console.log(`缺名稱：${missingNames.join(', ')}`);
  if (noIcon.length) console.log(`沒抽到圖示：${noIcon.join(', ')}`);
  if (linkedIcon.length) {
    console.log(`圖示是外連佔位（1×1），之後紙娃娃再處理：${linkedIcon.join(', ')}`);
  }
  const crossLines = Object.keys(crossIconRefs).sort().flatMap((fromId) => {
    const targets = crossIconRefs[fromId];
    return Object.keys(targets).sort().map((toId) => {
      const kinds = [...targets[toId]].sort().join(', ');
      return `  ${fromId}  icon 引用其他裝備 → ${toId}（${kinds}）`;
    });
  });
  if (crossLines.length) {
    console.log(`裝備 icon 跨 ID 引用（${crossLines.length} 筆）：`);
    crossLines.forEach((line) => console.log(line));
  }

  if (args.dryRun) {
    console.log('（dry-run，未寫檔）');
    return;
  }
  writeOutJs(records);
  console.log(`已寫入 ${path.relative(ROOT, OUT_JS)}`);
}

main();
