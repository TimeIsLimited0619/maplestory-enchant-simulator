/**
 * Extract Addon:statInfo + defenseFont PNGs from UICharacterInfo canvas XML.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CANVAS = path.join(ROOT, 'wz-xml/ui/UI._Canvas.UICharacterInfo.img.xml');
const OUT_SI = path.join(ROOT, 'images/UICharacterInfo/local/detailStat/Addon/statInfo');
const OUT_CANVAS = path.join(ROOT, 'images/UICharacterInfo/common/detailStat/canvas');

const xml = fs.readFileSync(CANVAS, 'utf8');

function extractNamed(section, names, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const re = /<png name="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*value="([A-Za-z0-9+/=]+)"/g;
  let m;
  const found = new Set();
  while ((m = re.exec(section))) {
    const name = m[1];
    const key = name.replace(/^canvas:/, '');
    if (names && !names.has(name) && !names.has(key)) continue;
    const file = path.join(outDir, `${key}.png`);
    fs.writeFileSync(file, Buffer.from(m[4], 'base64'));
    console.log('wrote', path.relative(ROOT, file), `${m[2]}x${m[3]}`);
    found.add(name);
  }
  return found;
}

const siStart = xml.indexOf('<dir name="Addon:statInfo">');
const siEnd = xml.indexOf('<dir name="Addon:apDistribution">', siStart);
if (siStart < 0 || siEnd < 0) {
  console.error('Addon:statInfo section not found');
  process.exit(1);
}
const siSection = xml.slice(siStart, siEnd);
extractNamed(siSection, null, OUT_SI);

const fontNames = new Set(['canvas:defenseFont', 'canvas:utilityFont']);
// Prefer SettingToolWZ2 / detailStat_KR if present; else any match in file
const krIdx = xml.indexOf('detailStat_KR');
let fontSection = xml;
if (krIdx >= 0) {
  const end = xml.indexOf('</dir>', xml.indexOf('canvas:defenseFont', krIdx) + 50);
  fontSection = xml.slice(krIdx, Math.max(end, krIdx + 500000));
}
const found = extractNamed(fontSection, fontNames, OUT_CANVAS);
if (!found.has('canvas:defenseFont')) {
  // fallback: first defenseFont in whole file
  extractNamed(xml, new Set(['canvas:defenseFont']), OUT_CANVAS);
}

console.log('done');
