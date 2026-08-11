import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function autoEnchantFlatPath(relativePath) {
  if (!relativePath) return null;
  if (/^images\/autoEnchant\/autoEnchant_/.test(relativePath)) return relativePath;
  if (/^images\/autoEnchant\/fullScreen_potential\.progressAlert\.\d+\.png$/.test(relativePath)) {
    return relativePath;
  }

  const legacyPotential = relativePath.match(
    /^images\/autoEnchant\/autoEnchant_fullScreen_potential_progressAlert_(\d+)\.png$/
  );
  if (legacyPotential) {
    return `images/autoEnchant/fullScreen_potential.progressAlert.${legacyPotential[1]}.png`;
  }

  const autoMatch = relativePath.match(/^images\/autoEnchant\/(.+)$/);
  if (autoMatch) {
    return `images/autoEnchant/autoEnchant_${autoMatch[1].replace(/[/:]/g, '_')}`;
  }

  const progressMatch = relativePath.match(
    /^images\/fullScreen_(potential|additionalPotential|bonusStat)\/progressAlert\/(\d+)\.png$/
  );
  if (progressMatch) {
    const [, kind, frame] = progressMatch;
    if (kind === 'potential' || kind === 'additionalPotential') {
      return `images/autoEnchant/fullScreen_potential.progressAlert.${frame}.png`;
    }
    if (kind === 'bonusStat') {
      return `images/fullScreenbonusStat/fullScreen_bonusStat_progressAlert_${frame}.png`;
    }
    return `images/autoEnchant/autoEnchant_starForce_progressAlert_${frame}.png`;
  }
  return relativePath;
}

function collect(o, arr = []) {
  if (!o) return arr;
  if (typeof o === 'string' && o.includes('images/')) arr.push(o);
  else if (Array.isArray(o)) o.forEach((x) => collect(x, arr));
  else if (typeof o === 'object') Object.values(o).forEach((x) => collect(x, arr));
  return arr;
}

const autoEnchantFiles = new Set(
  fs.readdirSync(path.join(ROOT, 'images/autoEnchant')).filter((f) => f.endsWith('.png'))
);
const bonusStatFiles = fs.existsSync(path.join(ROOT, 'images/fullScreenbonusStat'))
  ? new Set(fs.readdirSync(path.join(ROOT, 'images/fullScreenbonusStat')).filter((f) => f.endsWith('.png')))
  : new Set();

function fileExists(flatPath) {
  if (!flatPath) return false;
  if (flatPath.startsWith('images/autoEnchant/')) {
    return autoEnchantFiles.has(path.basename(flatPath));
  }
  if (flatPath.startsWith('images/fullScreenbonusStat/')) {
    return bonusStatFiles.has(path.basename(flatPath));
  }
  return fs.existsSync(path.join(ROOT, flatPath));
}

const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/auto-enchant-summary.json'), 'utf8'));
const srcs = [...new Set(collect(json))];
const missing = [];

for (const src of srcs) {
  const flat = autoEnchantFlatPath(src);
  if (/BattleSimulationReplay|starforce/.test(flat || src)) continue;
  if ((flat || src).endsWith('.png') && !fileExists(flat || src)) {
    missing.push(`${src} -> ${flat}`);
  }
}

console.log(`checked ${srcs.length} paths, missing ${missing.length}`);
missing.forEach((line) => console.log(line));
