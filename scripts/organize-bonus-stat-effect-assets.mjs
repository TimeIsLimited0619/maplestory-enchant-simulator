/**
 * 將 images/bonusStat/effect/ 根目錄的扁平 PNG 整理為子資料夾結構
 * bonusStat_{variant}_{phase}_... → effect/{variant}/{phase}/...
 *
 * 用法: node scripts/organize-bonus-stat-effect-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EFFECT_DIR = path.join(ROOT, 'images', 'bonusStat', 'effect');

const TRY_RE = /^bonusStat_([a-z]+)_try_(itemIcon_(?:back|front))_(\d+)\.png$/i;
const SUCCESS_RE = /^bonusStat_([a-z]+)_success_(\d+)_(itemIcon_(?:back|front)|textScreen)_(\d+)\.png$/i;

function layerDir(layerToken) {
  if (layerToken === 'textScreen') return 'textScreen';
  const part = layerToken.replace('itemIcon_', '');
  return `itemIcon/${part}`;
}

function targetPath(variant, phase, successVariant, layerToken, frameIndex) {
  const layerPath = layerDir(layerToken);
  const filePrefix = `effect.bonusStat.${variant}`;
  let rel;
  if (phase === 'try') {
    const layerFile = layerToken.replace('itemIcon_', 'itemIcon.');
    rel = `${variant}/try/${layerPath}/${filePrefix}.try.${layerFile}.${frameIndex}.png`;
  } else {
    const layerFile = layerToken === 'textScreen'
      ? 'textScreen'
      : layerToken.replace('itemIcon_', 'itemIcon.');
    rel = `${variant}/success/${successVariant}/${layerPath}/${filePrefix}.success.${successVariant}.${layerFile}.${frameIndex}.png`;
  }
  return path.join(EFFECT_DIR, rel.replace(/\//g, path.sep));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

if (!fs.existsSync(EFFECT_DIR)) {
  console.error('Missing directory:', EFFECT_DIR);
  process.exit(1);
}

const files = fs.readdirSync(EFFECT_DIR).filter((f) => f.endsWith('.png'));
let moved = 0;
let skipped = 0;

files.forEach((name) => {
  let dest = null;

  const tryMatch = name.match(TRY_RE);
  if (tryMatch) {
    const [, variant, layerToken, frameIndex] = tryMatch;
    dest = targetPath(variant, 'try', null, layerToken, frameIndex);
  }

  const successMatch = name.match(SUCCESS_RE);
  if (!dest && successMatch) {
    const [, variant, successVariant, layerToken, frameIndex] = successMatch;
    dest = targetPath(variant, 'success', successVariant, layerToken, frameIndex);
  }

  if (!dest) {
    skipped += 1;
    console.warn('skip:', name);
    return;
  }

  const src = path.join(EFFECT_DIR, name);
  ensureDir(dest);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(src);
  } else {
    fs.renameSync(src, dest);
  }
  moved += 1;
});

console.log(`Organized ${moved} files, skipped ${skipped}.`);
