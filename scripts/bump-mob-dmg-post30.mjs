/**
 * 將 post-30 地圖的小怪傷害再 ×3（atk1/2/3、skill1/2/3、legacy hit/skill）。
 * 不改 HP、BOSS 傷、CD。
 * 用法：node scripts/bump-mob-dmg-post30.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZONE_FILE = path.join(__dirname, '..', 'js', 'idleZonesData.js');
const MULT = Number(process.env.MOB_DMG_MULT || 3);

const MOB_DMG_KEYS = [
  'mobAtk1Dmg', 'mobAtk2Dmg', 'mobAtk3Dmg',
  'mobSkill1Dmg', 'mobSkill2Dmg', 'mobSkill3Dmg',
  'mobHitDmg', 'mobSkillDmg',
];

function curveLevel(m) {
  const ul = Math.max(1, Math.floor(Number(m.unlockLevel) || 1));
  const bmin = Math.floor(Number(m.bandMin) || 0);
  const bmax = Math.floor(Number(m.bandMax) || 0);
  if (bmin > 0 && bmax >= bmin) {
    return Math.max(ul, Math.floor((bmin + bmax) / 2));
  }
  return ul;
}

function extractArray(src, constName) {
  const marker = `const ${constName} = `;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`missing ${constName}`);
  const from = start + marker.length;
  let i = from;
  while (i < src.length && /\s/.test(src[i])) i += 1;
  if (src[i] !== '[') throw new Error(`${constName} not array`);
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (; i < src.length; i += 1) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return { maps: JSON.parse(src.slice(from, i + 1)), start: from, end: i + 1 };
      }
    }
  }
  throw new Error(`unclosed ${constName}`);
}

function roundNice(n) {
  const v = Math.max(0, Number(n) || 0);
  if (!(v > 0)) return 0;
  if (v < 100) return Math.round(v);
  if (v < 1000) return Math.round(v / 5) * 5;
  if (v < 10000) return Math.round(v / 50) * 50;
  if (v < 100000) return Math.round(v / 100) * 100;
  return Math.round(v / 500) * 500;
}

function main() {
  const src = fs.readFileSync(ZONE_FILE, 'utf8');
  const { maps, start, end } = extractArray(src, 'IDLE_ZONE_CUSTOM_MAPS');
  let n = 0;
  const samples = [];
  maps.forEach((m) => {
    if (curveLevel(m) <= 30) return;
    if ((Number(m.monsterHp) || 0) <= 1) return;
    const before = Number(m.mobAtk1Dmg) || Number(m.mobHitDmg) || 0;
    let changed = false;
    MOB_DMG_KEYS.forEach((k) => {
      const old = Number(m[k]);
      if (!(old > 0)) return;
      m[k] = roundNice(old * MULT);
      changed = true;
    });
    if (changed) {
      n += 1;
      const after = Number(m.mobAtk1Dmg) || Number(m.mobHitDmg) || 0;
      if (samples.length < 12 || /土龍|雲彩|絕壁|挖掘/.test(m.name || '')) {
        samples.push(`${m.name}: mobAtk1 ${before}→${after} (skill1 ${m.mobSkill1Dmg || 0}, atk2 ${m.mobAtk2Dmg || 0})`);
      }
    }
  });
  fs.writeFileSync(ZONE_FILE, `${src.slice(0, start)}${JSON.stringify(maps, null, 2)}${src.slice(end)}`, 'utf8');
  console.log(`Bumped mob dmg ×${MULT} on ${n} maps`);
  samples.slice(0, 15).forEach((s) => console.log(' -', s));
}

main();
