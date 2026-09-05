/**
 * 只抽出 UIWindow4 / ToadsHammer/main + eqpIcon（不碰特效與 popup）
 *   node scripts/import-toads-hammer-ui.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UI_DIR = path.join(ROOT, 'wz-xml', 'ui');
const OUT_DIR = path.join(ROOT, 'images', 'toadshammer');
const LAYOUT = path.join(UI_DIR, 'UI.UIWindow4.img.xml');
const CANVAS = path.join(UI_DIR, 'UI._Canvas.UIWindow4.img.xml');

function sliceDir(xml, dirName) {
  const start = xml.indexOf(`<dir name="${dirName}">`);
  if (start < 0) return null;
  let depth = 0;
  const re = /<\/?dir\b[^>]*>/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(xml))) {
    if (m[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return xml.slice(start, m.index + m[0].length);
    } else if (!/\/>\s*$/.test(m[0])) depth += 1;
  }
  return null;
}

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
    const node = { name: attrs.name || '', kind: tag, attrs, value: attrs.value, children: [] };
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

function collectMainTargets(hammerRoot) {
  const targets = [];
  function walk(node, parts) {
    if (!node) return;
    if (node.kind === 'png') {
      targets.push(parts.join('/'));
      return;
    }
    if (node.kind !== 'dir') return;
    const top = parts[1];
    if (parts.length >= 2 && top !== 'main' && top !== 'eqpIcon') return;
    (node.children || []).forEach((c) => walk(c, parts.concat(c.name || '')));
  }
  walk(hammerRoot, ['ToadsHammer']);
  return targets;
}

function main() {
  if (!fs.existsSync(LAYOUT) || !fs.existsSync(CANVAS)) {
    console.error('缺少 UIWindow4 layout 或 canvas');
    process.exit(1);
  }

  console.log('slice layout ToadsHammer…');
  const layoutChunk = sliceDir(fs.readFileSync(LAYOUT, 'utf8').replace(/^\uFEFF/, ''), 'ToadsHammer');
  if (!layoutChunk) {
    console.error('layout 無 ToadsHammer');
    process.exit(1);
  }
  const layoutRoot = parseWzXml(layoutChunk);

  console.log('slice canvas ToadsHammer…');
  const canvasChunk = sliceDir(fs.readFileSync(CANVAS, 'utf8').replace(/^\uFEFF/, ''), 'ToadsHammer');
  if (!canvasChunk) {
    console.error('canvas 無 ToadsHammer');
    process.exit(1);
  }
  const canvasRoot = parseWzXml(canvasChunk);
  const index = loadCanvasIndex(canvasRoot);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const targets = collectMainTargets(layoutRoot);
  let ok = 0;
  let fail = 0;
  for (const target of targets) {
    const parts = target.split('/');
    const rel = parts.slice(1); // drop ToadsHammer
    const pngNode = nodePath(layoutRoot, rel);
    let buf = null;
    if (pngNode?.kind === 'png') {
      const outlink = findChild(pngNode, '_outlink')?.value;
      if (outlink) {
        const m = String(outlink).match(/UI\/_Canvas\/UIWindow4\.img\/ToadsHammer\/(.+)$/i);
        if (m) {
          const cNode = index.get(m[1]) || nodePath(canvasRoot, m[1].split('/'));
          buf = decodePng(cNode?.value);
        }
      }
      if (!buf || buf.length < 50) buf = decodePng(pngNode.value);
    }
    if ((!buf || buf.length < 50)) {
      buf = decodePng(index.get(rel.join('/'))?.value);
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
  console.log(`done: ${ok} ok, ${fail} miss → ${OUT_DIR}`);
}

main();
