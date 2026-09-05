/**
 * 匯入 Effect.BasicEff.img / LevelUp → images + js/levelUpEffectData.js
 * 主檔：wz-xml/effect/Effect.BasicEff.img.xml
 * 像素：wz-xml/effect/Effect._Canvas.BasicEff.img.xml
 *
 *   node scripts/import-basic-eff-levelup.mjs
 *   npm run import:levelup
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EFFECT_ROOT = path.join(ROOT, 'wz-xml', 'effect');
const MAIN_XML = path.join(EFFECT_ROOT, 'Effect.BasicEff.img.xml');
const CANVAS_XML = path.join(EFFECT_ROOT, 'Effect._Canvas.BasicEff.img.xml');
const OUT_IMG = path.join(ROOT, 'images', 'effects', 'LevelUp');
const OUT_DATA = path.join(ROOT, 'js', 'levelUpEffectData.js');
const EFFECT_KEY = 'LevelUp';

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

function findChild(node, name) {
  return (node.children || []).find((c) => c.name === name) || null;
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

function outlinkKey(outlink) {
  const s = String(outlink || '');
  const i = s.indexOf('.img/');
  return i >= 0 ? s.slice(i + 5) : s.replace(/^.*?\.img\//, '');
}

function pngMeta(pngNode) {
  const originNode = findChild(pngNode, 'origin');
  const delayNode = findChild(pngNode, 'delay');
  const outlink = findChild(pngNode, '_outlink');
  const delayRaw = delayNode?.value;
  const delay = delayRaw != null && delayRaw !== '' ? Number(delayRaw) : null;
  return {
    origin: parseVector(originNode?.value),
    delay: Number.isFinite(delay) && delay > 0 ? delay : null,
    outlink: outlink?.value || '',
  };
}

function collectNumberedPngs(dirNode) {
  const frames = [];
  (dirNode.children || []).forEach((c) => {
    if (c.kind === 'png' && /^\d+$/.test(c.name)) {
      frames.push({ frame: Number(c.name), node: c });
    }
  });
  frames.sort((a, b) => a.frame - b.frame);
  return frames;
}

async function sliceDirLines(filePath, startLine, endLine) {
  const lines = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let n = 0;
  for await (const line of rl) {
    n += 1;
    if (n < startLine) continue;
    if (n > endLine) break;
    lines.push(line);
  }
  if (n < endLine) {
    throw new Error(`檔案行數不足：${filePath}（需要到 ${endLine} 行，僅 ${n} 行）`);
  }
  return lines.join('\n');
}

async function main() {
  if (!fs.existsSync(MAIN_XML)) {
    console.error('缺少主檔：', MAIN_XML);
    process.exit(1);
  }
  if (!fs.existsSync(CANVAS_XML)) {
    console.error('缺少 Canvas：', CANVAS_XML);
    process.exit(1);
  }

  // 只切出 LevelUp 區段，避免整檔載入 Canvas（過大）
  const mainChunk = await sliceDirLines(MAIN_XML, 18069, 18193);
  const canvasChunk = await sliceDirLines(CANVAS_XML, 2298, 2319);

  const mainRoot = parseWzXml(`<dir name="BasicEff.img">${mainChunk}</dir>`);
  const canvasRoot = parseWzXml(`<dir name="BasicEff.img">${canvasChunk}</dir>`);
  const canvasIndex = pngIndexFromTree(canvasRoot);

  const effectDir = (mainRoot.children || []).find((c) => c.name === EFFECT_KEY);
  if (!effectDir) {
    console.error(`主檔找不到 ${EFFECT_KEY}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_IMG, { recursive: true });

  const frames = [];
  let exported = 0;
  let missing = 0;

  for (const { frame, node } of collectNumberedPngs(effectDir)) {
    const meta = pngMeta(node);
    const delay = meta.delay || 90;
    let src = '';

    if (meta.outlink) {
      const key = outlinkKey(meta.outlink);
      const linked = canvasIndex[key];
      const buf = linked ? decodePng(linked.value) : null;
      if (buf && buf.length > 200) {
        const outFile = path.join(OUT_IMG, `${frame}.png`);
        fs.writeFileSync(outFile, buf);
        src = `images/effects/LevelUp/${frame}.png`;
        exported += 1;
        console.log('OK', frame, buf.length);
      } else {
        missing += 1;
        console.warn('MISS pixel', frame, key);
      }
    }

    frames.push({
      index: frame,
      delay,
      origin: meta.origin,
      ...(src ? { src } : {}),
    });
  }

  const js = `/** 由 scripts/import-basic-eff-levelup.mjs 產生，請勿手改。 */
const LEVEL_UP_EFFECT = ${JSON.stringify({ id: EFFECT_KEY, frames }, null, 2)};

if (typeof window !== 'undefined') {
  window.LEVEL_UP_EFFECT = LEVEL_UP_EFFECT;
}
`;

  fs.writeFileSync(OUT_DATA, js, 'utf8');
  console.log(`\n完成：${exported} 張 PNG，${frames.length} 幀 → ${OUT_DATA}`);
  if (missing) console.warn(`缺圖：${missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
