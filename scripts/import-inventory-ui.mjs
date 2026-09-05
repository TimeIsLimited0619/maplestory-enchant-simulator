/**
 * 從 wz-xml/ui/UI.UIInventory + Canvas 抽出背包 UI 圖到 images/iventory/
 *   node scripts/import-inventory-ui.mjs
 *
 * 預設匯出 Inventory/AutoBuild 全部按鈕／分頁狀態（normal/pressed/mouseOver/disabled）
 * 以及 backgrnd、scroll:slot。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UI_DIR = path.join(ROOT, 'wz-xml', 'ui');
const OUT_DIR = path.join(ROOT, 'images', 'iventory');
const LAYOUT = path.join(UI_DIR, 'UI.UIInventory.img.xml');

const CANVAS_PACKS = [
  'UIInventory',
  'Quest',
  'Basic',
  'BattleSimulationReplay',
];

const EXTRA_TARGETS = [
  'Inventory/backgrnd',
  'Inventory/FullBackgrnd',
  'Inventory/AutoBuild/scroll:slot/enabled/base',
  'Inventory/AutoBuild/scroll:slot/enabled/thumb0',
  'Inventory/AutoBuild/scroll:slot/enabled/thumb1',
  'Inventory/AutoBuild/scroll:slot/enabled/thumb2',
  'Inventory/FullAutoBuild/scroll:avatarTab/enabled/base',
  'Inventory/FullAutoBuild/scroll:avatarTab/enabled/thumb0',
  'Inventory/FullAutoBuild/scroll:avatarTab/enabled/thumb1',
  'Inventory/FullAutoBuild/scroll:avatarTab/enabled/thumb2',
];

const BUTTON_STATES = ['normal', 'pressed', 'mouseOver', 'disabled'];
const BUILD_DIRS = ['AutoBuild', 'FullAutoBuild'];

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

function parseOutlink(outlink) {
  const m = String(outlink || '').match(/UI\/_Canvas\/([^/]+)\.img\/(.+)$/i);
  if (!m) return null;
  return { file: m[1], parts: m[2].split('/') };
}

function loadCanvasIndex(canvasRoot) {
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
  const canvases = new Map();
  for (const name of CANVAS_PACKS) {
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

/** 收集 AutoBuild / FullAutoBuild 下 button:* / tab:category 的 png 路徑 */
function collectBuildTargets(layoutRoot, buildName) {
  const targets = [];
  const auto = nodePath(layoutRoot, ['Inventory', buildName]);
  if (!auto) return targets;

  for (const child of auto.children || []) {
    if (child.kind !== 'dir') continue;
    if (child.name.startsWith('button:')) {
      for (const state of BUTTON_STATES) {
        const st = findChild(child, state);
        const png = st ? findChild(st, '0') : null;
        if (png?.kind === 'png') {
          targets.push(`Inventory/${buildName}/${child.name}/${state}/0`);
        }
      }
    }
    if (child.name === 'tab:category') {
      for (const mode of ['normal', 'selected']) {
        const folder = findChild(child, mode);
        if (!folder) continue;
        for (const png of folder.children || []) {
          if (png.kind === 'png') {
            targets.push(`Inventory/${buildName}/tab:category/${mode}/${png.name}`);
          }
        }
      }
    }
    // Full 搜尋列 layer
    if (child.name === 'layer:search' && child.kind === 'dir') {
      const png = findChild(child, '0') || child.children?.find((c) => c.kind === 'png');
      if (png?.kind === 'png') {
        targets.push(`Inventory/${buildName}/layer:search/${png.name || '0'}`);
      }
    }
  }
  return targets;
}

function collectAutoBuildTargets(layoutRoot) {
  return BUILD_DIRS.flatMap((name) => collectBuildTargets(layoutRoot, name));
}

function exportTarget(layoutRoot, canvases, target) {
  const parts = target.split('/');
  const pngNode = nodePath(layoutRoot, parts);
  let buf = null;
  if (pngNode?.kind === 'png') {
    const outlink = findChild(pngNode, '_outlink')?.value;
    buf = resolvePng(canvases, outlink, pngNode);
  }
  if ((!buf || buf.length < 50)) {
    const pack = canvases.get('UIInventory');
    const cNode = pack?.index.get(target);
    buf = decodePng(cNode?.value);
  }
  if (!buf || buf.length < 50) return null;
  const outName = fileNameFromPath(target);
  fs.writeFileSync(path.join(OUT_DIR, outName), buf);
  return { outName, size: buf.length };
}

function main() {
  if (!fs.existsSync(LAYOUT)) {
    console.error('缺少 UI.UIInventory.img.xml');
    process.exit(1);
  }
  const layoutRoot = parseWzXml(fs.readFileSync(LAYOUT, 'utf8').replace(/^\uFEFF/, ''));
  const canvases = loadCanvases();
  if (!canvases.has('UIInventory')) {
    console.error('缺少 UI._Canvas.UIInventory.img.xml');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const targets = [
    ...EXTRA_TARGETS,
    ...collectAutoBuildTargets(layoutRoot),
  ];
  // 去重
  const seen = new Set();
  const unique = targets.filter((t) => {
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  let ok = 0;
  let fail = 0;
  for (const target of unique) {
    const result = exportTarget(layoutRoot, canvases, target);
    if (!result) {
      console.warn('MISS', target);
      fail += 1;
      continue;
    }
    console.log('OK', target, '→', result.outName, `(${result.size}b)`);
    ok += 1;
  }

  // 相容舊檔名：同步 backgrnd → inventory_bg.png、meso normal → mesoIcon.png
  const bg = path.join(OUT_DIR, fileNameFromPath('Inventory/backgrnd'));
  if (fs.existsSync(bg)) {
    fs.copyFileSync(bg, path.join(OUT_DIR, 'inventory_bg.png'));
    console.log('SYNC inventory_bg.png');
  }
  const fullBg = path.join(OUT_DIR, fileNameFromPath('Inventory/FullBackgrnd'));
  if (fs.existsSync(fullBg)) {
    fs.copyFileSync(fullBg, path.join(OUT_DIR, 'UIInventory.img.Inventory.FullBackgrnd.png'));
    console.log('SYNC UIInventory.img.Inventory.FullBackgrnd.png');
  }
  const meso = path.join(OUT_DIR, fileNameFromPath('Inventory/AutoBuild/button:meso/normal/0'));
  if (fs.existsSync(meso)) {
    fs.copyFileSync(meso, path.join(OUT_DIR, 'mesoIcon.png'));
    console.log('SYNC mesoIcon.png');
  }

  console.log(`done: ${ok} ok, ${fail} miss → ${OUT_DIR}`);
}

main();
