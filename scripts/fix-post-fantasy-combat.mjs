/**
 * 奇幻村之後所有有地圖的區塊：對齊 band 目錄，並依 30–100 戰鬥曲線重算。
 * 跳過 hp<=1 佔位關（可設 INCLUDE_STUBS=1 一併寫入）。
 * 用法：node scripts/fix-post-fantasy-combat.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZONE_FILE = path.join(__dirname, '..', 'js', 'idleZonesData.js');
const INCLUDE_STUBS = process.env.INCLUDE_STUBS === '1';

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

/** 明顯錯誤的入場等級覆寫（其餘維持） */
const UNLOCK_FIX = {
  c172: 50, // 遺跡首關不該 ul=30
  c199: 60, // 天空之塔第6層
  c200: 60, // 天空之塔第5層誤設 300
  c205: 70, // 絕壁 I 誤掛低等
  c206: 65, // 冰面 I
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

/** 天空之塔：依樓層數字排序（6→1 漸難） */
function towerFloor(name) {
  const m = String(name || '').match(/第(\d+)層/);
  return m ? Number(m[1]) : null;
}

function sortBandMaps(list, bandName) {
  if (bandName === '天空之塔') {
    return list.slice().sort((a, b) => {
      const fa = towerFloor(a.name);
      const fb = towerFloor(b.name);
      if (fa != null && fb != null) return fb - fa; // 6,5,4,3,2,1
      return (Number(a.mapIndex) || 0) - (Number(b.mapIndex) || 0);
    });
  }
  return list.slice().sort((a, b) => (Number(a.mapIndex) || 0) - (Number(b.mapIndex) || 0));
}

function applyBand(list, band) {
  const sorted = sortBandMaps(list, band.name);
  const n = sorted.length;
  const rows = [];
  sorted.forEach((m, i) => {
    const isStub = (Number(m.monsterHp) || 0) <= 1;
    if (isStub && !INCLUDE_STUBS) {
      // 仍對齊 band 欄位，不改戰鬥
      m.bandMin = band.min;
      m.bandMax = band.max;
      m.bandName = band.name;
      m.bandKey = band.id;
      rows.push({
        id: m.mapId,
        name: m.name,
        band: `${band.min}-${band.max}`,
        skipped: 'stub',
      });
      return;
    }

    const t = n <= 1 ? 0 : i / (n - 1);
    const L = band.min + t * (band.max - band.min);

    const before = {
      hp: Number(m.monsterHp) || 0,
      bossHp: Number(m.bossHp) || 0,
      mobAtk: primaryMobAtk(m),
      bossAtk: primaryBossAtk(m),
      ul: m.unlockLevel,
      mapBand: `${m.bandMin}-${m.bandMax}`,
    };

    m.bandMin = band.min;
    m.bandMax = band.max;
    m.bandName = band.name;
    m.bandKey = band.id;

    if (UNLOCK_FIX[m.mapId] != null) {
      m.unlockLevel = UNLOCK_FIX[m.mapId];
    } else {
      // 入場等級至少落在帶內下限附近（過低才抬）
      const ul = Math.floor(Number(m.unlockLevel) || 0);
      if (ul > 0 && ul < band.min - 5) {
        m.unlockLevel = Math.round(band.min + t * (band.max - band.min));
      }
    }

    const hp = roundNice(interpAnchors(HP_ANCHORS, L));
    const mobAtk = roundNice(interpAnchors(DMG_ANCHORS, L) * MOB_ATK_MULT);
    const bossAtk = roundNice(interpAnchors(BOSS_ATK_ANCHORS, L));

    m.monsterHp = hp;
    m.bossHp = roundNice(hp * BOSS_HP_MULT);
    setMobAtkAbsolute(m, mobAtk);
    setBossAtkAbsolute(m, bossAtk);

    rows.push({
      id: m.mapId,
      name: m.name,
      band: `${band.min}-${band.max}`,
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

  const fantasy = bands.find((b) => b.name === '奇幻村');
  const afterMin = Number(fantasy?.max) || 50; // 之後：band.min >= 50

  const targetBands = bands
    .filter((b) => Number(b.min) >= afterMin)
    .sort((a, b) => Number(a.min) - Number(b.min) || Number(a.max) - Number(b.max));

  const allRows = [];
  targetBands.forEach((band) => {
    const list = maps.filter((m) => m.bandKey === band.id || m.bandName === band.name);
    if (!list.length) return;
    allRows.push(...applyBand(list, band));
  });

  const out = `${src.slice(0, mapsEx.start)}${JSON.stringify(maps, null, 2)}${src.slice(mapsEx.end)}`;
  fs.writeFileSync(ZONE_FILE, out, 'utf8');

  console.log(`Updated bands starting min>=${afterMin}; rows=${allRows.length}`);
  allRows.forEach((r) => {
    if (r.skipped) {
      console.log(`[${r.band}] ${r.id} ${r.name}: SKIP ${r.skipped}`);
      return;
    }
    console.log(
      `[${r.band}] L${r.L} ${r.id} ${r.name}: HP ${r.before.hp}→${r.after.hp}, atk ${r.before.mobAtk}→${r.after.mobAtk}, bossAtk ${r.before.bossAtk}→${r.after.bossAtk}, ul ${r.before.ul}→${r.after.ul}`,
    );
  });

  // continuity check
  const combat = allRows.filter((r) => !r.skipped);
  for (let i = 1; i < combat.length; i += 1) {
    const a = combat[i - 1];
    const b = combat[i];
    if (a.band === b.band && b.after.hp + 1 < a.after.hp) {
      console.warn(`WARN non-mono within band: ${a.id} ${a.after.hp} -> ${b.id} ${b.after.hp}`);
    }
  }
}

main();
