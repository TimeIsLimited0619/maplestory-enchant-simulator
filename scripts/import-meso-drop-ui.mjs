/**
 * Extract meso drop animation frames (iconRaw 0..n) from Special 0900 canvas.
 *   node scripts/import-meso-drop-ui.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CANVAS = path.join(ROOT, 'wz-xml', 'item', 'Item.Special._Canvas.0900.img.xml');
const OUT = path.join(ROOT, 'images', 'meso');
const IDS = ['09000000', '09000001', '09000002', '09000003'];

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

const xml = fs.readFileSync(CANVAS, 'utf8').replace(/^\uFEFF/, '');
fs.mkdirSync(OUT, { recursive: true });

for (const id of IDS) {
  const chunk = sliceDir(xml, id);
  if (!chunk) {
    console.warn('MISS id', id);
    continue;
  }
  const raw = sliceDir(chunk, 'iconRaw') || chunk;
  const frames = [...raw.matchAll(/<png name="(\d+)"[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*value="([^"]+)"/g)];
  if (!frames.length) {
    // try without width attrs order
    const alt = [...raw.matchAll(/<png name="(\d+)"[^>]*value="([^"]+)"/g)];
    for (const m of alt) {
      const [, name, b64] = m;
      const buf = Buffer.from(b64, 'base64');
      if (buf.length < 50) continue;
      const out = path.join(OUT, `${id}__iconRaw__${name}.png`);
      fs.writeFileSync(out, buf);
      console.log('OK', id, name, buf.length);
    }
    continue;
  }
  for (const m of frames) {
    const [, name, , , b64] = m;
    const buf = Buffer.from(b64, 'base64');
    if (buf.length < 50) continue;
    const out = path.join(OUT, `${id}__iconRaw__${name}.png`);
    fs.writeFileSync(out, buf);
    console.log('OK', id, name, buf.length);
  }
}
console.log('done →', OUT);
