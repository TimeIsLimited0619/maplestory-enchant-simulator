/**
 * 修正奇幻村（40–50）與秘密森林埃羅汀（30–40）的 band／戰鬥數值。
 * 用法：node scripts/fix-fantasy-elodin-bands.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZONE_FILE = path.join(__dirname, '..', 'js', 'idleZonesData.js');

const BOSS_HP_MULT = 15;
const MOB_ATK_MULT = 3;
const H30 = 8950;
const D30 = 365;
const HP51 = 160000;
const HP_ANCHORS = [
  [30, H30],
  [51, HP51],
  [60, 280000],
  [70, 700000],
  [80, 1800000],
  [100, 6000000],
];
const dmg51 = Math.max(Math.round(D30 * 1.5), Math.round(HP51 * 0.00175));
const DMG_ANCHORS = [
  [30, D30],
  [51, dmg51],
  [60, Math.round(dmg51 * 1.35)],
  [70, Math.round(dmg51 * 2.2)],
  [80, Math.round(dmg51 * 3.5)],
  [100, Math.round(dmg51 * 6)],
];
const BOSS_ATK_ANCHORS = [
  [30, Math.max(Math.round(D30 * 8), 800)],
  [51, 4200],
  [60, 5500],
  [70, 8000],
  [80, 12000],
  [100, 20000],
];

const BAND_FIX = {
  'band-1787780051528': { min: 30, max: 40, name: '秘密森林埃羅汀' }, // 埃羅汀
  'band-1787736998035': { min: 40, max: 50, name: '奇幻村' },
};

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

function median(nums) {
  const a = nums.filter((n) => Number.isFinite(n) && n > 0).sort((x, y) => x - y);
  if (!a.length) return 0;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function logInterp(x0, y0, x1, y1, x) {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  if (!(y0 > 0) || !(y1 > 0)) return lerp(y0, y1, (x - x0) / (x1 - x0));
  const t = (x - x0) / (x1 - x0);
  return Math.exp(lerp(Math.log(y0), Math.log(y1), t));
}

function interpAnchors(anchors, L) {
  const pts = anchors.map(([x, y]) => [x, y]).sort((a, b) => a[0] - b[0]);
  if (L <= pts[0][0]) return pts[0][1];
  if (L >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (L >= x0 && L <= x1) return logInterp(x0, y0, x1, y1, L);
  }
  return pts[pts.length - 1][1];
}

function roundNice(n) {
  const v = Math.max(1, Number(n) || 0);
  if (v < 100) return Math.round(v);
  if (v < 1000) return Math.round(v / 5) * 5;
  if (v < 10000) return Math.round(v / 50) * 50;
  if (v < 100000) return Math.round(v / 100) * 100;
  if (v < 1000000) return Math.round(v / 1000) * 1000;
  return Math.round(v / 5000) * 5000;
}

function primaryMobAtk(m) {
  const a = Number(m.mobAtk1Dmg);
  if (Number.isFinite(a) && a > 0) return a;
  const h = Number(m.mobHitDmg);
  return Number.isFinite(h) && h > 0 ? h : 0;
}

function primaryBossAtk(m) {
  const a = Number(m.bossAtk1Dmg);
  if (Number.isFinite(a) && a > 0) return a;
  const h = Number(m.bossHitDmg);
  return Number.isFinite(h) && h > 0 ? h : 0;
}

function scaleField(m, key, factor) {
  if (!Object.prototype.hasOwnProperty.call(m, key)) return;
  const old = Number(m[key]);
  if (!(old > 0) || !Number.isFinite(old)) return;
  m[key] = roundNice(old * factor);
}

function setMobAtkAbsolute(m, target) {
  const oldPrimary = primaryMobAtk(m);
  const t = Math.max(1, roundNice(target));
  if (oldPrimary > 0) {
    const factor = t / oldPrimary;
    ['mobAtk1Dmg', 'mobAtk2Dmg', 'mobAtk3Dmg', 'mobSkill1Dmg', 'mobSkill2Dmg', 'mobSkill3Dmg', 'mobHitDmg', 'mobSkillDmg']
      .forEach((k) => scaleField(m, k, factor));
  }
  if (Object.prototype.hasOwnProperty.call(m, 'mobAtk1Dmg') || Number(m.mobAtk1Dmg) > 0) m.mobAtk1Dmg = t;
  else if (Number(m.mobHitDmg) > 0) m.mobHitDmg = t;
  else m.mobAtk1Dmg = t;
}

function setBossAtkAbsolute(m, target) {
  const oldPrimary = primaryBossAtk(m);
  const t = Math.max(1, roundNice(target));
  if (oldPrimary > 0) {
    const factor = t / oldPrimary;
    ['bossAtk1Dmg', 'bossAtk2Dmg', 'bossAtk3Dmg', 'bossSkill1Dmg', 'bossSkill2Dmg', 'bossSkill3Dmg', 'bossHitDmg', 'bossSkillDmg']
      .forEach((k) => scaleField(m, k, factor));
  }
  if (Object.prototype.hasOwnProperty.call(m, 'bossAtk1Dmg') || Number(m.bossAtk1Dmg) > 0) m.bossAtk1Dmg = t;
  else if (Number(m.bossHitDmg) > 0) m.bossHitDmg = t;
  else m.bossAtk1Dmg = t;
}

function curveLevel(m) {
  const ul = Math.max(1, Math.floor(Number(m.unlockLevel) || 1));
  const bmin = Math.floor(Number(m.bandMin) || 0);
  const bmax = Math.floor(Number(m.bandMax) || 0);
  if (bmin > 0 && bmax >= bmin) return Math.max(ul, Math.floor((bmin + bmax) / 2));
  return ul;
}

/**
 * 帶內進度：依地圖順序 0..1 線性拉開，避免用「目前錯位數值」當相對基準。
 * 奇幻村／埃羅汀都用 mapIndex 排序。
 */
function applyBandCombat(list, bandMeta) {
  const sorted = list.slice().sort((a, b) => (Number(a.mapIndex) || 0) - (Number(b.mapIndex) || 0));
  const n = sorted.length;
  const rows = [];

  sorted.forEach((m, i) => {
    m.bandMin = bandMeta.min;
    m.bandMax = bandMeta.max;
    m.bandName = bandMeta.name;
    m.bandKey = bandMeta.id;

    const t = n <= 1 ? 0.5 : i / (n - 1);
    // 曲線等級：帶下限～上限之間隨關卡推進（銜接處對齊，不另乘進度倍率）
    const L = bandMeta.min + t * (bandMeta.max - bandMeta.min);
    const prog = 1;

    const baseHp = interpAnchors(HP_ANCHORS, L);
    const baseMobAtk = interpAnchors(DMG_ANCHORS, L) * MOB_ATK_MULT;
    const baseBossAtk = interpAnchors(BOSS_ATK_ANCHORS, L);

    const before = {
      hp: Number(m.monsterHp) || 0,
      bossHp: Number(m.bossHp) || 0,
      mobAtk: primaryMobAtk(m),
      bossAtk: primaryBossAtk(m),
      band: `${m.bandMin}-${m.bandMax}`,
    };

    m.monsterHp = roundNice(baseHp * prog);
    m.bossHp = roundNice(m.monsterHp * BOSS_HP_MULT);
    setMobAtkAbsolute(m, baseMobAtk * prog);
    setBossAtkAbsolute(m, baseBossAtk);

    rows.push({
      id: m.mapId,
      name: m.name,
      band: `${bandMeta.min}-${bandMeta.max}`,
      L: +L.toFixed(1),
      prog: +prog.toFixed(2),
      before,
      after: {
        hp: m.monsterHp,
        bossHp: m.bossHp,
        mobAtk: primaryMobAtk(m),
        bossAtk: primaryBossAtk(m),
      },
    });
  });
  return rows;
}

function main() {
  const src = fs.readFileSync(ZONE_FILE, 'utf8');
  const { maps, start, end } = extractArray(src, 'IDLE_ZONE_CUSTOM_MAPS');

  const rows = [];
  Object.entries(BAND_FIX).forEach(([bandId, meta]) => {
    const list = maps.filter((m) => m.bandKey === bandId || m.bandName === meta.name);
    if (!list.length) throw new Error(`no maps for ${meta.name}`);
    rows.push(...applyBandCombat(list, { ...meta, id: bandId }));
  });

  fs.writeFileSync(ZONE_FILE, `${src.slice(0, start)}${JSON.stringify(maps, null, 2)}${src.slice(end)}`, 'utf8');

  rows.sort((a, b) => a.band.localeCompare(b.band) || a.L - b.L || a.id.localeCompare(b.id));
  console.log(`Updated ${rows.length} maps\n`);
  rows.forEach((r) => {
    console.log(
      `[${r.band}] L${r.L} ${r.id} ${r.name}: HP ${r.before.hp}→${r.after.hp}, boss ${r.before.bossHp}→${r.after.bossHp}, mobAtk ${r.before.mobAtk}→${r.after.mobAtk}, bossAtk ${r.before.bossAtk}→${r.after.bossAtk}`,
    );
  });

  const elodin = rows.filter((r) => r.band === '30-40');
  const fantasy = rows.filter((r) => r.band === '40-50');
  const eMax = Math.max(...elodin.map((r) => r.after.hp));
  const fMin = Math.min(...fantasy.map((r) => r.after.hp));
  console.log(`\nElodin max HP=${eMax}, Fantasy min HP=${fMin}, orderOk=${fMin >= eMax * 0.9}`);
}

main();
