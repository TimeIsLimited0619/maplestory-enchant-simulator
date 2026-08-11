/**
 * 整理 images/fullscreen_potential/ 根目錄的 flip 動畫 PNG
 * fullScreen_potential_choiceBox_eff_flip_{appear|loop}_{front|back}_{N}.png
 *   → choiceBox/eff/flip/{appear|loop}/{front|back}/{N}.png
 *
 * 用法: node scripts/organize-fullscreen-potential-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FP_DIR = path.join(ROOT, 'images', 'fullscreen_potential');

const FLIP_RE = /^fullScreen_potential_choiceBox_eff_flip_(appear|loop)_(front|back)_(\d+)\.png$/i;
const RANKUP_RE = /^fullScreen_potential_choiceBox_eff_rankUp_(epic|unique|legendary)_(front|back)_(\d+)\.png$/i;

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveAsset(name, dest) {
  const src = path.join(FP_DIR, name);
  ensureDir(dest);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(src);
  } else {
    fs.renameSync(src, dest);
  }
}

if (!fs.existsSync(FP_DIR)) {
  console.error('Missing directory:', FP_DIR);
  process.exit(1);
}

const files = fs.readdirSync(FP_DIR).filter((f) => f.endsWith('.png'));
let flipMoved = 0;
let rankUpMoved = 0;
let skipped = 0;

files.forEach((name) => {
  const flipMatch = name.match(FLIP_RE);
  if (flipMatch) {
    const [, phase, layer, frameIndex] = flipMatch;
    moveAsset(name, path.join(FP_DIR, 'choiceBox', 'eff', 'flip', phase, layer, `${frameIndex}.png`));
    flipMoved += 1;
    return;
  }

  const rankMatch = name.match(RANKUP_RE);
  if (rankMatch) {
    const [, rank, layer, frameIndex] = rankMatch;
    moveAsset(name, path.join(FP_DIR, 'choiceBox', 'eff', 'rankUp', rank, layer, `${frameIndex}.png`));
    rankUpMoved += 1;
    return;
  }

  skipped += 1;
});

console.log(`Organized ${flipMoved} flip files, ${rankUpMoved} rankUp files, skipped ${skipped}.`);
