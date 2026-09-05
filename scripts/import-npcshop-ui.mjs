/**
 * 從 wz-xml/ui/UINpcShop + 相關 Canvas 抽出商店 UI 圖到 images/npcshop/
 *   node scripts/import-npcshop-ui.mjs
 *
 * 支援 outlink：UI/_Canvas/{Name}.img/...
 * 會自動載入 UI._Canvas.UINpcShop / SkillSequence / Basic / Quest
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UI_DIR = path.join(ROOT, 'wz-xml', 'ui');
const OUT_DIR = path.join(ROOT, 'images', 'npcshop');
const LAYOUT = path.join(UI_DIR, 'UI.UINpcShop.img.xml');

/** layout 內路徑（經 _outlink 解析） */
const LAYOUT_TARGETS = [
  'Shop/backgrnd',
  'Shop/itemList/back/normal',
  'Shop/itemList/back/selected',
  'Shop/itemList/disabled',
  'Shop/tab:npc/normal/0',
  'Shop/tab:npc/selected/0',
  'Shop/scroll:shop/enabled/base',
  'PointInfo/Meso/iconShop',
  'Inventory/Normal/backgrnd',
  'Inventory/Normal/layer:meso',
  'Inventory/Normal/canvas:selected',
  'Inventory/Normal/tab:inventory/normal/0',
  'Inventory/Normal/tab:inventory/normal/1',
  'Inventory/Normal/tab:inventory/normal/2',
  'Inventory/Normal/tab:inventory/normal/3',
  'Inventory/Normal/tab:inventory/selected/0',
  'Inventory/Normal/tab:inventory/selected/1',
  'Inventory/Normal/tab:inventory/selected/2',
  'Inventory/Normal/tab:inventory/selected/3',
  'Inventory/Normal/button:close/normal/0',
  'Inventory/Normal/button:close/pressed/0',
  'Inventory/Normal/button:close/mouseOver/0',
  'Inventory/Normal/itemList/back/normal',
  'popup/Buy/mid_buyForMeso/canvas:backgrnd',
  'popup/Buy/mid_buyForMeso/button:Plus/normal/0',
  'popup/Buy/mid_buyForMeso/button:Plus/pressed/0',
  'popup/Buy/mid_buyForMeso/button:Plus/mouseOver/0',
  'popup/Buy/mid_buyForMeso/button:Minus/normal/0',
  'popup/Buy/mid_buyForMeso/button:Minus/pressed/0',
  'popup/Buy/mid_buyForMeso/button:Minus/mouseOver/0',
  'popup/Buy/top/canvas:backgrnd',
  'popup/Buy/bottom/canvas:bottom',
  'popup/Buy/bottom/button:Yes/normal/0',
  'popup/Buy/bottom/button:Yes/pressed/0',
  'popup/Buy/bottom/button:Yes/mouseOver/0',
  'popup/Buy/bottom/button:No/normal/0',
  'popup/Buy/bottom/button:No/pressed/0',
  'popup/Buy/bottom/button:No/mouseOver/0',
];

/** 直接從指定 canvas 檔抽取（僅作 fallback） */
const DIRECT_TARGETS = [];

function parseAttrs(raw) {
  const out = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(raw || ''))) out[m[1]] = m[2];
  return out;
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
    if (!selfClose && !['vector', 'string', 'uol', 'int32', 'int16', 'int8', 'int', 'short', 'float', 'double'].includes(tag)) {
      stack.push(node);
    }
  }
  return root.children[0] || root;
}

function findChild(node, name) {
  return (node.children || []).find((c) => c.name === name) || null;
}

function nodePath(root, parts) {
  let cur = root;
  for (const p of parts) {
    if (!cur) return null;
    cur = findChild(cur, p);
  }
  return cur;
}

function decodePng(b64) {
  if (!b64) return null;
  try {
    return Buffer.from(b64, 'base64');
  } catch (_) {
    return null;
  }
}

/** @returns {{ file: string, parts: string[] } | null} */
function parseOutlink(outlink) {
  const m = String(outlink || '').match(/UI\/_Canvas\/([^/]+)\.img\/(.+)$/i);
  if (!m) return null;
  return { file: m[1], parts: m[2].split('/') };
}

function loadCanvasIndex(canvasRoot) {
  /** @type {Map<string, any>} */
  const map = new Map();
  function walk(node, parts) {
    if (!node) return;
    if (node.kind === 'png') map.set(parts.join('/'), node);
    (node.children || []).forEach((c) => walk(c, parts.concat(c.name || '')));
  }
  walk(canvasRoot, []);
  return map;
}

function fileNameFromPath(p) {
  return p.replace(/:/g, '_').replace(/\//g, '__') + '.png';
}

function loadCanvases() {
  /** @type {Map<string, { root: any, index: Map<string, any> }>} */
  const canvases = new Map();
  for (const name of ['UINpcShop', 'SkillSequence', 'Basic', 'Quest']) {
    const fp = path.join(UI_DIR, `UI._Canvas.${name}.img.xml`);
    if (!fs.existsSync(fp)) {
      console.warn('缺 canvas 檔:', fp);
      continue;
    }
    const root = parseWzXml(fs.readFileSync(fp, 'utf8').replace(/^\uFEFF/, ''));
    canvases.set(name, { root, index: loadCanvasIndex(root) });
  }
  return canvases;
}

function resolvePng(canvases, outlink, fallbackNode) {
  let buf = null;
  if (outlink) {
    const parsed = parseOutlink(outlink);
    if (parsed) {
      const pack = canvases.get(parsed.file);
      if (pack) {
        const key = parsed.parts.join('/');
        const cNode = pack.index.get(key) || nodePath(pack.root, parsed.parts);
        buf = decodePng(cNode?.value);
      }
    }
  }
  if ((!buf || buf.length < 50) && fallbackNode) buf = decodePng(fallbackNode.value);
  return buf;
}

function main() {
  if (!fs.existsSync(LAYOUT)) {
    console.error('缺少 UI.UINpcShop.img.xml');
    process.exit(1);
  }
  const layoutRoot = parseWzXml(fs.readFileSync(LAYOUT, 'utf8').replace(/^\uFEFF/, ''));
  const canvases = loadCanvases();
  if (!canvases.has('UINpcShop')) {
    console.error('缺少 UI._Canvas.UINpcShop.img.xml');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let fail = 0;

  for (const target of LAYOUT_TARGETS) {
    const parts = target.split('/');
    const pngNode = nodePath(layoutRoot, parts);
    let buf = null;
    if (pngNode?.kind === 'png') {
      const outlink = findChild(pngNode, '_outlink')?.value;
      buf = resolvePng(canvases, outlink, pngNode);
    }
    if (!buf || buf.length < 50) {
      // 直接在 UINpcShop canvas
      const pack = canvases.get('UINpcShop');
      const cNode = pack?.index.get(target);
      buf = decodePng(cNode?.value);
    }
    if (!buf || buf.length < 50) {
      console.warn('MISS', target);
      fail += 1;
      continue;
    }
    const outName = fileNameFromPath(target);
    fs.writeFileSync(path.join(OUT_DIR, outName), buf);
    console.log('OK', target, '→', outName, `(${buf.length}b)`);
    ok += 1;
  }

  for (const row of DIRECT_TARGETS) {
    const pack = canvases.get(row.canvas);
    const cNode = pack?.index.get(row.path) || (pack ? nodePath(pack.root, row.path.split('/')) : null);
    const buf = decodePng(cNode?.value);
    if (!buf || buf.length < 50) {
      console.warn('MISS direct', row.canvas, row.path);
      fail += 1;
      continue;
    }
    fs.writeFileSync(path.join(OUT_DIR, row.out), buf);
    console.log('OK', `${row.canvas}/${row.path}`, '→', row.out, `(${buf.length}b)`);
    ok += 1;
  }

  console.log(`done: ${ok} ok, ${fail} miss → ${OUT_DIR}`);
}

main();
