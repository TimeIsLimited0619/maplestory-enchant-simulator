/**
 * 章節 80–100：玩具城（80–90）＋時間通道（90–100）戰鬥曲線重算。
 * 用法：node scripts/fix-zone-combat-80-100.mjs
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

/** 要處理的 band 等級下限範圍（含） */
const BAND_MIN_LO = 80;
const BAND_MIN_HI = 90; // 80–90 玩具城、90–100 時間通道（min=90）

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
        return { value: JSON.parse(src.slice(from, i + 1)), start: from, end: i + 1 };
      }
    }
  }
  throw new Error(`unclosed ${constName}`);
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

function applyBand(list, band) {
  const sorted = list.slice().sort((a, b) => (Number(a.mapIndex) || 0) - (Number(b.mapIndex) || 0));
  const n = sorted.length;
  const rows = [];
  sorted.forEach((m, i) => {
    const t = n <= 1 ? 0 : i / (n - 1);
    const L = band.min + t * (band.max - band.min);
    const before = {
      hp: Number(m.monsterHp) || 0,
      bossHp: Number(m.bossHp) || 0,
      mobAtk: primaryMobAtk(m),
      bossAtk: primaryBossAtk(m),
      ul: m.unlockLevel,
    };

    m.bandMin = band.min;
    m.bandMax = band.max;
    m.bandName = band.name;
    m.bandKey = band.id;

    // 入場等級對齊帶內進度
    m.unlockLevel = Math.round(band.min + t * (band.max - band.min));
    if (m.dropMin != null) m.dropMin = m.unlockLevel;
    if (m.dropMax != null) m.dropMax = Math.max(m.unlockLevel, Number(m.dropMax) || m.unlockLevel);

    const hp = roundNice(interpAnchors(HP_ANCHORS, L));
    const mobAtk = roundNice(interpAnchors(DMG_ANCHORS, L) * MOB_ATK_MULT);
    const bossAtkVal = roundNice(interpAnchors(BOSS_ATK_ANCHORS, L));

    m.monsterHp = hp;
    m.bossHp = roundNice(hp * BOSS_HP_MULT);
    setMobAtkAbsolute(m, mobAtk);
    setBossAtkAbsolute(m, bossAtkVal);

    rows.push({
      id: m.mapId,
      name: m.name,
      band: `${band.min}-${band.max}`,
      bandName: band.name,
      L: +L.toFixed(1),
      before,
      after: {
        hp: m.monsterHp,
        bossHp: m.bossHp,
        mobAtk: primaryMobAtk(m),
        bossAtk: primaryBossAtk(m),
        ul: m.unlockLevel,
      },
    });
  });
  return rows;
}

function main() {
  const src = fs.readFileSync(ZONE_FILE, 'utf8');
  const bandsEx = extractArray(src, 'IDLE_ZONE_BAND_DEFS');
  const mapsEx = extractArray(src, 'IDLE_ZONE_CUSTOM_MAPS');
  const bands = bandsEx.value;
  const maps = mapsEx.value;

  const targetBands = bands
    .filter((b) => {
      const mn = Number(b.min) || 0;
      return mn >= BAND_MIN_LO && mn <= BAND_MIN_HI;
    })
    .sort((a, b) => Number(a.min) - Number(b.min) || Number(a.max) - Number(b.max));

  if (!targetBands.length) throw new Error('no target bands in 80–100');

  const allRows = [];
  targetBands.forEach((band) => {
    const list = maps.filter((m) => m.bandKey === band.id || m.bandName === band.name);
    if (!list.length) {
      console.warn(`no maps for ${band.name} (${band.id})`);
      return;
    }
    allRows.push(...applyBand(list, band));
  });

  fs.writeFileSync(
    ZONE_FILE,
    `${src.slice(0, mapsEx.start)}${JSON.stringify(maps, null, 2)}${src.slice(mapsEx.end)}`,
    'utf8',
  );

  console.log(`Updated ${allRows.length} maps across ${targetBands.map((b) => b.name).join('、')}\n`);
  allRows.forEach((r) => {
    console.log(
      `[${r.band}|${r.bandName}] L${r.L} ${r.id}: HP ${r.before.hp}→${r.after.hp}, atk ${r.before.mobAtk}→${r.after.mobAtk}, bossAtk ${r.before.bossAtk}→${r.after.bossAtk}, ul ${r.before.ul}→${r.after.ul}`,
    );
  });

  // continuity
  const byBand = new Map();
  allRows.forEach((r) => {
    if (!byBand.has(r.band)) byBand.set(r.band, []);
    byBand.get(r.band).push(r);
  });
  const bandKeys = [...byBand.keys()];
  for (let i = 1; i < bandKeys.length; i += 1) {
    const prev = byBand.get(bandKeys[i - 1]);
    const next = byBand.get(bandKeys[i]);
    const a = prev[prev.length - 1];
    const b = next[0];
    console.log(`\nhandoff ${a.band} end HP=${a.after.hp} → ${b.band} start HP=${b.after.hp}`);
  }
}

main();
