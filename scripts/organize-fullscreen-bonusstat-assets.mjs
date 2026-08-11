/**
 * 整理 images/fullScreenbonusStat/ 根目錄的 flip 動畫 PNG
 * fullScreen_bonusStat_choiceBox_eff_flip_{appear|loop}_{front|back}_{N}.png
 *   → choiceBox/eff/flip/{appear|loop}/{front|back}/{N}.png
 *
 * 用法: node scripts/organize-fullscreen-bonusstat-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FS_DIR = path.join(ROOT, 'images', 'fullScreenbonusStat');

const FLIP_RE = /^fullScreen_bonusStat_choiceBox_eff_flip_(appear|loop)_(front|back)_(\d+)\.png$/i;

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

if (!fs.existsSync(FS_DIR)) {
  console.error('Missing directory:', FS_DIR);
  process.exit(1);
}

const files = fs.readdirSync(FS_DIR).filter((f) => f.endsWith('.png'));
let moved = 0;
let skipped = 0;

files.forEach((name) => {
  const match = name.match(FLIP_RE);
  if (!match) {
    skipped += 1;
    return;
  }

  const [, phase, layer, frameIndex] = match;
  const dest = path.join(FS_DIR, 'choiceBox', 'eff', 'flip', phase, layer, `${frameIndex}.png`);
  const src = path.join(FS_DIR, name);

  ensureDir(dest);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(src);
  } else {
    fs.renameSync(src, dest);
  }
  moved += 1;
});

console.log(`Organized ${moved} flip files, skipped ${skipped} non-flip files.`);
