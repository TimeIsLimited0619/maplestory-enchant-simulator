/**
 * 從 Character.00002000.img 抽出技能／特殊動作 instruction 腳本
 *（對齊 MapleSalon2：CharacterLoader.loadInstructionMap）
 *
 * 僅擷取「第 0 幀有 action 字串」的目錄（slashBlast、LeapAttack 等），
 * 不匯入身體 PNG。
 *
 *   node scripts/import-action-instructions.mjs
 *   npm run import:action-instructions
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SKIN_XML = path.join(ROOT, 'wz-xml', 'character', 'skin', 'Character.00002000.img.xml');
const OUT_DATA = path.join(ROOT, 'js', 'paperdollActionInstructions.js');

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
    if (!selfClose && tag !== 'vector' && tag !== 'string' && tag !== 'uol'
      && tag !== 'int32' && tag !== 'int16' && tag !== 'int8' && tag !== 'int'
      && tag !== 'short' && tag !== 'float' && tag !== 'double') {
      stack.push(node);
    }
  }
  return root.children[0] || root;
}

function findChild(node, name) {
  if (!node) return null;
  return (node.children || []).find((c) => c.name === name) || null;
}

function parseMove(value) {
  if (value == null || value === '') return null;
  const parts = String(value).split(',').map((s) => Number(String(s).trim()));
  if (!Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  return [parts[0], parts[1]];
}

function extractInstructions(imgRoot) {
  /** @type {Record<string, Array<{ action: string, frame: number, delay: number, move?: number[], flip?: number }>>} */
  const map = {};
  (imgRoot.children || []).forEach((actionNode) => {
    if (actionNode.kind !== 'dir' || !actionNode.name) return;
    const frame0 = findChild(actionNode, '0');
    const actionStr = findChild(frame0, 'action');
    // 對齊 MapleSalon2：至少第 0 幀要有 action 字串（否則是身體 PNG 動作）
    if (!actionStr || actionStr.kind !== 'string' || !actionStr.value) return;

    const frames = [];
    const frameNodes = (actionNode.children || [])
      .filter((c) => c.kind === 'dir' && /^\d+$/.test(c.name))
      .sort((a, b) => Number(a.name) - Number(b.name));

    frameNodes.forEach((fn) => {
      const act = findChild(fn, 'action')?.value;
      if (!act) return;
      const frameRaw = Number(findChild(fn, 'frame')?.value);
      const delayRaw = Number(findChild(fn, 'delay')?.value);
      const move = parseMove(findChild(fn, 'move')?.value);
      const flipRaw = Number(findChild(fn, 'flip')?.value);
      const step = {
        action: String(act),
        frame: Number.isFinite(frameRaw) ? frameRaw : 0,
        // MapleSalon2：Math.abs(delay || 100)
        delay: Math.abs(Number.isFinite(delayRaw) ? delayRaw : 100) || 100,
      };
      if (move) step.move = move;
      if (flipRaw === 1) step.flip = 1;
      frames.push(step);
    });

    if (frames.length >= 1) map[actionNode.name] = frames;
  });
  return map;
}

function main() {
  if (!fs.existsSync(SKIN_XML)) {
    console.error('缺少', path.relative(ROOT, SKIN_XML));
    process.exit(1);
  }
  console.log('讀取', path.relative(ROOT, SKIN_XML), '…');
  const xml = fs.readFileSync(SKIN_XML, 'utf8').replace(/^\uFEFF/, '');
  const root = parseWzXml(xml);
  const map = extractInstructions(root);
  const names = Object.keys(map).sort();
  console.log(`instruction 動作 ${names.length} 個`);
  ['slashBlast', 'slashBlast2', 'LeapAttack', 'LeapAttack2'].forEach((n) => {
    console.log(`  ${n}: ${map[n] ? `${map[n].length} frames` : 'MISSING'}`);
  });

  const js = `/** 由 scripts/import-action-instructions.mjs 產生（來源 Character.00002000.img），請勿手改。 */
const PAPERDOLL_ACTION_INSTRUCTIONS = ${JSON.stringify(map, null, 2)};

if (typeof window !== 'undefined') {
  window.PAPERDOLL_ACTION_INSTRUCTIONS = PAPERDOLL_ACTION_INSTRUCTIONS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PAPERDOLL_ACTION_INSTRUCTIONS;
}
`;
  fs.writeFileSync(OUT_DATA, js, 'utf8');
  console.log('wrote', path.relative(ROOT, OUT_DATA));
}

main();
