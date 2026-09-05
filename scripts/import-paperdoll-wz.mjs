/**
 * 從 wz-xml/character/{部位} 抽出紙娃娃動作圖層，
 * 寫入 images/paperdoll/、js/paperdollData.js、js/paperdollItems.js。
 * 與裝備 XML 同一批資料夾；zmap／smap 讀 wz-xml/base/。
 * 裝備目錄請另跑 npm run import:wz；怪物請跑 npm run import:mob。
 *
 *   node scripts/import-paperdoll-wz.mjs
 *
 * KEEP_ACTIONS：stand／揮砍／刺擊／跳躍等；技能名（slashBlast 等）若 WZ 有則一併匯入。
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { outlinkEquipId, outlinkWzPart } from './wz-equip-outlink.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WZ_ROOT = path.join(ROOT, 'wz-xml');
const CHAR_ROOT = path.join(WZ_ROOT, 'character');
const STRING_ROOT = path.join(WZ_ROOT, 'string');
const BASE_ROOT = path.join(WZ_ROOT, 'base');
const OUT_IMG = path.join(ROOT, 'images', 'paperdoll');
const OUT_ICON = path.join(ROOT, 'images', 'equip');
const OUT_ICON_RAW = path.join(ROOT, 'images', 'equipRaw');
const OUT_DATA = path.join(ROOT, 'js', 'paperdollData.js');
const OUT_ITEMS = path.join(ROOT, 'js', 'paperdollItems.js');
const require = createRequire(import.meta.url);

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
  hair: 'Hair',
  face: 'Face',
  skin: 'Skin',
  body: 'Skin',
  head: 'Head',
};

const WZPART_TO_FOLDER = Object.fromEntries(
  Object.entries(FOLDER_TO_WZPART).map(([folder, part]) => [part.toLowerCase(), folder]),
);

const KEEP_ACTIONS = new Set([
  'stand1', 'stand2',
  'swingT1', 'swingT2', 'swingT3', 'swingTF',
  'swingO1', 'swingO2', 'swingO3', 'swingOF',
  'swingP1', 'swingP2', 'swingPF',
  'stabT1', 'stabT2', 'stabTF',
  'stabO1', 'stabO2', 'stabOF',
  'alert', 'jump', 'heal',
  // slashBlast／LeapAttack 等為 00002000 instruction，見 import-action-instructions.mjs
  'default', 'front',
]);
const SKIP_PART_NAMES = new Set(['lefEar', 'highlefEar', 'ear']);
const INFO_KEYS = [
  'islot', 'vslot', 'reqJob', 'reqLevel', 'tuc', 'cash', 'price',
  'incSTR', 'incDEX', 'incINT', 'incLUK', 'incPAD', 'incMAD',
  'incPDD', 'incMDD', 'incMHP', 'incMMP', 'incEVA', 'incACC',
  'attackSpeed', 'afterImage', 'sfx', 'setItemID', 'imdR', 'bdR',
  'equipTradeBlock', 'tradeAvailable', 'charmEXP', 'bossReward', 'exItem',
];
const ITEM_NAMES = {
  '01005980': '永恆劍士頭盔',
  '01042433': '永恆劍士鎧甲',
  '01053063': '紙娃娃測試套服',
  '01062285': '永恆劍士褲',
  '01073629': '永恆劍士鞋',
  '01082760': '永恆劍士手套',
  '01103433': '永恆劍士斗篷',
  '01092030': '紙娃娃測試盾',
  '01302376': '命運長劍',
  '01402295': '命運雙手劍',
};

function padId(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits ? digits.padStart(8, '0').slice(-8) : '';
}

function parseAttrs(raw) {
  const out = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(raw || ''))) out[m[1]] = m[2];
  return out;
}

function parseVector(value) {
  const m = String(value || '').match(/(-?\d+)\s*,\s*(-?\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}

function parseWzXml(xml) {
  const root = { name: '', kind: 'dir', children: [], attrs: {}, value: null };
  const stack = [root];
  const re = /<(\/)?(dir|img|png|vector|string|uol|int32|int16|int8|int|short|float|double)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(xml))) {
    const closing = !!m[1];
    const tag = m[2];
    const rawAttrs = String(m[3] || '').replace(/\/\s*$/, '');
    const selfClose = /\/\s*$/.test(m[3] || '');
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs = parseAttrs(rawAttrs);
    const node = {
      name: attrs.name || '',
      kind: tag,
      attrs,
      value: attrs.value,
      children: [],
    };
    stack[stack.length - 1].children.push(node);
    if (!selfClose && tag !== 'vector' && tag !== 'string' && tag !== 'uol'
      && tag !== 'int32' && tag !== 'int16' && tag !== 'int8' && tag !== 'int'
      && tag !== 'short' && tag !== 'float' && tag !== 'double') {
      stack.push(node);
    }
  }
  return root.children[0] || root;
}

function childMap(node) {
  const map = Object.create(null);
  (node.children || []).forEach((c) => {
    if (!c.name) return;
    if (!map[c.name]) map[c.name] = c;
  });
  return map;
}

function findChild(node, name) {
  return (node.children || []).find((c) => c.name === name) || null;
}

function nodePath(node, parts) {
  let cur = node;
  for (const p of parts) {
    if (!cur) return null;
    cur = findChild(cur, p);
  }
  return cur;
}

function collectNamedOrder(node) {
  return (node.children || []).map((c) => c.name).filter(Boolean);
}

function pngIndexFromTree(imgRoot) {
  const index = Object.create(null);
  function walk(node, parts) {
    if (!node) return;
    if (node.kind === 'png') {
      index[parts.concat(node.name).join('/')] = node;
    }
    (node.children || []).forEach((c) => {
      if (c.kind === 'png') walk(c, parts);
      else if (c.kind === 'dir' || c.kind === 'img') walk(c, parts.concat(c.name));
    });
  }
  walk(imgRoot, []);
  return index;
}

function decodePng(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 32 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return buf;
}

function isCanvasFileName(name) {
  return /_canvas/i.test(String(name || ''));
}

function isPaperdollXmlName(name) {
  const n = String(name || '').toLowerCase();
  if (n.startsWith('.')) return false;
  if (n.endsWith('.png') || n === '.gitkeep') return false;
  if (isCanvasFileName(n)) return false;
  return /\.img(\.xml)?$/i.test(n) || /\.xml$/i.test(n);
}

function canvasFileFor(filePath, itemId, wzPart) {
  const folderDir = filePath ? path.dirname(filePath) : folderForWzPart(wzPart);
  if (!folderDir) return null;
  const names = [
    wzPart ? `Character.${wzPart}._Canvas.${itemId}.img.xml` : '',
    `Character._Canvas.${itemId}.img.xml`,
    `${itemId}.img.xml`,
  ].filter(Boolean);
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
      if (padId(name) === itemId) return path.join(dir, name);
    }
  }
  return null;
}

function folderForWzPart(wzPart) {
  const folder = WZPART_TO_FOLDER[String(wzPart || '').toLowerCase()];
  return folder ? path.join(CHAR_ROOT, folder) : null;
}

function loadEquipCanvasIndex(linkId, linkWzPart, cache) {
  const key = `${linkWzPart}:${linkId}`;
  if (cache.has(key)) return cache.get(key);
  let index = null;
  const canvasPath = canvasFileFor(null, linkId, linkWzPart);
  if (canvasPath) {
    const cxml = fs.readFileSync(canvasPath, 'utf8').replace(/^\uFEFF/, '');
    index = pngIndexFromTree(parseWzXml(cxml));
  }
  cache.set(key, index);
  return index;
}

function wzPartFromFile(fileName) {
  const m = String(fileName).match(/^Character\.([A-Za-z]+)\./);
  if (m && m[1] !== '_Canvas') return m[1];
  return '';
}

function resolveUol(imgRoot, fromParts, uolValue) {
  const bits = String(uolValue || '').split('/').filter(Boolean);
  const stack = fromParts.slice();
  for (const b of bits) {
    if (b === '..') stack.pop();
    else stack.push(b);
  }
  return nodePath(imgRoot, stack);
}

function pngMeta(pngNode) {
  const originNode = findChild(pngNode, 'origin') || (pngNode.children || []).find((c) => c.name === 'origin');
  const zNode = findChild(pngNode, 'z');
  const mapDir = findChild(pngNode, 'map');
  const outlink = findChild(pngNode, '_outlink');
  const map = {};
  (mapDir?.children || []).forEach((c) => {
    if (c.kind === 'vector') map[c.name] = parseVector(c.value);
  });
  return {
    z: zNode?.value || pngNode.name || 'body',
    origin: parseVector(originNode?.value),
    map,
    outlink: outlink?.value || '',
  };
}

function outlinkKey(outlink) {
  const s = String(outlink || '');
  const i = s.indexOf('.img/');
  return i >= 0 ? s.slice(i + 5) : s.replace(/^.*?\d{8}\.img\//, '');
}

function writePng(itemId, action, frame, partName, buf) {
  const dir = path.join(OUT_IMG, itemId, action, String(frame));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${partName}.png`);
  fs.writeFileSync(file, buf);
  return `images/paperdoll/${itemId}/${action}/${frame}/${partName}.png`;
}

function extractInfo(imgRoot) {
  const info = findChild(imgRoot, 'info');
  const out = {};
  (info?.children || []).forEach((c) => {
    if (!INFO_KEYS.includes(c.name)) return;
    if (c.kind === 'string' || c.kind === 'uol') out[c.name] = c.value;
    else {
      const n = Number(c.value);
      out[c.name] = Number.isNaN(n) ? c.value : n;
    }
  });
  return { info, data: out };
}

function extractNamedIcon(itemId, infoNode, canvasIndex, pngName, opts = {}) {
  const node = findChild(infoNode, pngName);
  if (!node) return false;
  let buf = decodePng(node.value);
  if (!buf || buf.length < 200) {
    const meta = pngMeta(node);
    const key = outlinkKey(meta.outlink) || `info/${node.name}`;
    let index = canvasIndex;
    const linkId = outlinkEquipId(meta.outlink);
    const linkPart = outlinkWzPart(meta.outlink) || opts.wzPart || '';
    if (linkId && linkId !== itemId) {
      opts.onCrossRef?.(linkId, pngName);
      if (opts.canvasCache) {
        const crossIndex = loadEquipCanvasIndex(linkId, linkPart, opts.canvasCache);
        if (crossIndex) index = crossIndex;
      }
    } else if (linkId && !canvasIndex && opts.canvasCache) {
      const crossIndex = loadEquipCanvasIndex(linkId, linkPart, opts.canvasCache);
      if (crossIndex) index = crossIndex;
    }
    const canvasPng = index?.[key];
    buf = decodePng(canvasPng?.value) || buf;
  }
  if (!buf || buf.length < 200) return false;
  return buf;
}

function extractIcon(itemId, infoNode, canvasIndex, opts = {}) {
  const iconBuf = extractNamedIcon(itemId, infoNode, canvasIndex, 'icon', opts)
    || extractNamedIcon(itemId, infoNode, canvasIndex, 'iconRaw', opts);
  const rawBuf = extractNamedIcon(itemId, infoNode, canvasIndex, 'iconRaw', opts)
    || extractNamedIcon(itemId, infoNode, canvasIndex, 'icon', opts);
  if (!iconBuf && !rawBuf) return false;
  if (iconBuf) {
    fs.mkdirSync(OUT_ICON, { recursive: true });
    fs.writeFileSync(path.join(OUT_ICON, `${itemId}.png`), iconBuf);
  }
  if (rawBuf) {
    fs.mkdirSync(OUT_ICON_RAW, { recursive: true });
    fs.writeFileSync(path.join(OUT_ICON_RAW, `${itemId}.png`), rawBuf);
  }
  return true;
}

function frameDirs(actionNode) {
  const numbered = (actionNode.children || []).filter((c) => c.kind === 'dir' && /^\d+$/.test(c.name));
  if (numbered.length) {
    return numbered.sort((a, b) => Number(a.name) - Number(b.name));
  }
  return [actionNode];
}

function extractItem(filePath, wzPartHint, opts = {}) {
  const fileName = path.basename(filePath);
  const itemId = padId(fileName);
  const xml = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const imgRoot = parseWzXml(xml);
  const wzPart = wzPartHint || wzPartFromFile(fileName);
  const canvasPath = canvasFileFor(filePath, itemId, wzPart);
  let canvasIndex = Object.create(null);
  if (canvasPath) {
    const cxml = fs.readFileSync(canvasPath, 'utf8').replace(/^\uFEFF/, '');
    canvasIndex = pngIndexFromTree(parseWzXml(cxml));
  }
  const { info: infoNode, data: info } = extractInfo(imgRoot);
  if (infoNode && /^\d{8}$/.test(itemId) && Number(itemId) >= 1000000) {
    extractIcon(itemId, infoNode, canvasIndex, {
      wzPart,
      canvasCache: opts.canvasCache,
      onCrossRef: (toId, pngName) => opts.onCrossRef?.(itemId, toId, pngName),
    });
  }

  const actions = {};
  (imgRoot.children || []).forEach((actionNode) => {
    if (actionNode.kind !== 'dir') return;
    if (!KEEP_ACTIONS.has(actionNode.name)) return;
    const frames = [];
    frameDirs(actionNode).forEach((frameNode, idx) => {
      const frameName = /^\d+$/.test(frameNode.name) ? frameNode.name : String(idx);
      const delayNode = findChild(frameNode, 'delay') || findChild(actionNode, 'delay');
      const parts = [];
      (frameNode.children || []).forEach((child) => {
        if (SKIP_PART_NAMES.has(child.name)) return;
        let pngNode = child;
        const fromParts = [actionNode.name];
        if (/^\d+$/.test(frameNode.name) && frameNode !== actionNode) fromParts.push(frameNode.name);
        if (child.kind === 'uol') {
          pngNode = resolveUol(imgRoot, fromParts, child.value);
          if (!pngNode || pngNode.kind !== 'png') return;
        } else if (child.kind !== 'png') {
          return;
        }
        const meta = pngMeta(pngNode);
        const key = outlinkKey(meta.outlink) || [...fromParts, child.name].join('/');
        let buf = decodePng(canvasIndex[key]?.value) || decodePng(pngNode.value);
        if (!buf || buf.length < 80) {
          const alt = Object.keys(canvasIndex).find((k) => k.endsWith(`/${child.name}`) && k.includes(actionNode.name));
          if (alt) buf = decodePng(canvasIndex[alt].value);
        }
        if (!buf || buf.length < 80) return;
        const src = writePng(itemId, actionNode.name, frameName, child.name, buf);
        parts.push({
          name: child.name,
          z: meta.z,
          origin: meta.origin,
          map: meta.map,
          src,
        });
      });
      if (!parts.length) return;
      frames.push({
        delay: Number(delayNode?.value) || 180,
        parts,
      });
    });
    if (frames.length) actions[actionNode.name] = { frames };
  });

  return { itemId, wzPart, info, actions };
}

function findBaseXml(kind) {
  const names = [
    `Base.${kind}.img.xml`,
    `${kind}.img.xml`,
    `Base.${kind}.img`,
    `${kind}.img`,
  ];
  const dirs = [BASE_ROOT, WZ_ROOT, path.join(ROOT, 'wz素材')];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of names) {
      const p = path.join(dir, name);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }
  }
  return null;
}

function parseZmap() {
  const p = findBaseXml('zmap');
  if (!p) return null;
  const xml = fs.readFileSync(p, 'utf8');
  return collectNamedOrder(parseWzXml(xml));
}

function parseSmap() {
  const p = findBaseXml('smap');
  if (!p) return null;
  const xml = fs.readFileSync(p, 'utf8');
  const root = parseWzXml(xml);
  const smap = {};
  (root.children || []).forEach((c) => {
    if (c.kind === 'string') smap[c.name] = c.value || '';
  });
  return smap;
}

function listPaperdollFiles() {
  const out = [];
  if (!fs.existsSync(CHAR_ROOT)) return out;

  function addDir(dir, wzPart) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
    for (const name of fs.readdirSync(dir)) {
      if (!isPaperdollXmlName(name)) continue;
      out.push({ filePath: path.join(dir, name), wzPart });
    }
  }

  addDir(CHAR_ROOT, '');
  for (const folder of fs.readdirSync(CHAR_ROOT)) {
    const dir = path.join(CHAR_ROOT, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    const key = folder.toLowerCase();
    if (key === '_canvas') continue;
    addDir(dir, FOLDER_TO_WZPART[key] || folder);
  }
  return out.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

function loadExistingData() {
  try {
    if (!fs.existsSync(OUT_DATA)) return null;
    return require(OUT_DATA).PAPERDOLL_DATA || null;
  } catch {
    return null;
  }
}

function loadExistingItems() {
  try {
    if (!fs.existsSync(OUT_ITEMS)) return [];
    return require(OUT_ITEMS).PAPERDOLL_EQUIP_RECORDS || [];
  } catch {
    return [];
  }
}

function lookupName(names, itemId) {
  if (!names || typeof names.get !== 'function') return null;
  return names.get(itemId)
    || names.get(itemId.replace(/^0+/, ''))
    || names.get(String(Number(itemId)))
    || null;
}

export function importPaperdoll({ names = null, dryRun = false } = {}) {
  const files = listPaperdollFiles();
  const prev = loadExistingData();
  if (!files.length) {
    console.log('紙娃娃：wz-xml/character 沒有可匯入的 XML，沿用既有 paperdollData。');
    return { items: 0, equips: 0 };
  }

  const items = { ...(prev?.items || {}) };
  const equipById = Object.create(null);
  const canvasCache = new Map();
  loadExistingItems().forEach((row) => {
    if (row?.id) equipById[row.id] = row;
  });

  files.forEach(({ filePath, wzPart }) => {
    console.log('paperdoll', path.relative(ROOT, filePath));
    if (dryRun) return;
    const rec = extractItem(filePath, wzPart, { canvasCache });
    if (!rec?.itemId) return;
    items[rec.itemId] = {
      wzPart: rec.wzPart,
      info: rec.info,
      actions: rec.actions,
    };
    if (rec.info?.islot && Number(rec.itemId) >= 1000000) {
      equipById[rec.itemId] = {
        id: rec.itemId,
        name: lookupName(names, rec.itemId) || ITEM_NAMES[rec.itemId] || rec.itemId,
        info: { ...rec.info, wzPart: rec.wzPart },
      };
    }
  });

  if (dryRun) {
    console.log(`紙娃娃 dry-run：${files.length} 個檔`);
    return { items: files.length, equips: 0 };
  }

  const zmap = parseZmap() || prev?.zmap || [];
  const smap = parseSmap() || prev?.smap || {};
  const defaults = { ...(prev?.defaults || {
    skin: '00002012',
    head: '00012012',
    hair: '00071301',
    face: '00058727',
  }) };
  if (items['00002012']) defaults.skin = '00002012';
  if (items['00012012']) defaults.head = '00012012';
  if (items['00071301']) defaults.hair = '00071301';
  if (items['00058727']) defaults.face = '00058727';

  const data = { defaults, zmap, smap, items };
  const js = `/** 由 scripts/import-paperdoll-wz.mjs 從 wz-xml/ 產生。不要手改。 */\n`
    + `const PAPERDOLL_DATA = ${JSON.stringify(data)};\n`
    + `if (typeof window !== 'undefined') window.PAPERDOLL_DATA = PAPERDOLL_DATA;\n`
    + `if (typeof module !== 'undefined' && module.exports) module.exports = { PAPERDOLL_DATA };\n`;
  fs.writeFileSync(OUT_DATA, js);

  const equipRows = Object.keys(equipById).sort().map((id) => equipById[id]);
  const itemsJs = `/** 紙娃娃裝備（wz-xml），由 scripts/import-paperdoll-wz.mjs 產生。 */\n`
    + `const PAPERDOLL_EQUIP_RECORDS = ${JSON.stringify(equipRows)};\n`
    + `if (typeof window !== 'undefined') window.PAPERDOLL_EQUIP_RECORDS = PAPERDOLL_EQUIP_RECORDS;\n`
    + `if (typeof module !== 'undefined' && module.exports) module.exports = { PAPERDOLL_EQUIP_RECORDS };\n`;
  fs.writeFileSync(OUT_ITEMS, itemsJs);

  console.log(`紙娃娃：${Object.keys(items).length} 件、${equipRows.length} 件裝備外觀`);
  return { items: Object.keys(items).length, equips: equipRows.length };
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  importPaperdoll();
}
