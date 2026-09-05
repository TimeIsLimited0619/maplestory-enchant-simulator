/**
 * 30 等後狩獵地圖 HP／傷害重算（不改 CD）。
 * 用法：node scripts/rescale-zone-combat-post30.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZONE_FILE = path.join(__dirname, '..', 'js', 'idleZonesData.js');
const REPORT_FILE = path.join(__dirname, '..', 'scripts', '_zone-combat-rescale-report.md');

const BOSS_HP_MULT = 15;
const ANCHOR_HP = [
  // L30 filled at runtime from data median
  [51, 160000],
  [60, 280000],
  [70, 700000],
  [80, 1800000],
  [100, 6000000],
];
const ANCHOR_BOSS_ATK = [
  [30, null], // filled from D30 * ratio or data
  [51, 4200],
  [60, 5500],
  [70, 8000],
  [80, 12000],
  [100, 20000],
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

function isOutlier(m) {
  const hp = Number(m.monsterHp) || 0;
  return hp > 0 && hp <= 1;
}

function shouldRescale(m) {
  if (isOutlier(m)) return false;
  // >30：一般後段；==30 且 HP 明顯偏高（舊龍／寺院等）一併納入
  const L = curveLevel(m);
  if (L > 30) return true;
  if (L >= 30 && (Number(m.monsterHp) || 0) >= 50000) return true;
  return false;
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
        const json = src.slice(from, i + 1);
        return { maps: JSON.parse(json), start: from, end: i + 1 };
      }
    }
  }
  throw new Error(`unclosed ${constName}`);
}

function primaryMobAtk(m) {
  const a = Number(m.mobAtk1Dmg);
  if (Number.isFinite(a) && a > 0) return a;
  const h = Number(m.mobHitDmg);
  if (Number.isFinite(h) && h > 0) return h;
  return 0;
}

function primaryBossAtk(m) {
  const a = Number(m.bossAtk1Dmg);
  if (Number.isFinite(a) && a > 0) return a;
  const h = Number(m.bossHitDmg);
  if (Number.isFinite(h) && h > 0) return h;
  return 0;
}

function scaleField(m, key, factor) {
  if (!Object.prototype.hasOwnProperty.call(m, key)) return;
  const old = Number(m[key]);
  if (!(old > 0) || !Number.isFinite(old)) return;
  m[key] = roundNice(old * factor);
}

function applyMobHp(m, newHp, bandMedianOldHp) {
  const oldHp = Number(m.monsterHp) || 0;
  let hp = newHp;
  if (bandMedianOldHp > 0 && oldHp > 0) {
    hp = newHp * (oldHp / bandMedianOldHp);
  }
  m.monsterHp = roundNice(hp);
  m.bossHp = roundNice(m.monsterHp * BOSS_HP_MULT);
}

function applyMobAtk(m, newAtk, bandMedianOldAtk) {
  const oldPrimary = primaryMobAtk(m);
  let target = newAtk;
  if (bandMedianOldAtk > 0 && oldPrimary > 0) {
    target = newAtk * (oldPrimary / bandMedianOldAtk);
  }
  target = Math.max(1, roundNice(target));
  const factor = oldPrimary > 0 ? target / oldPrimary : 1;
  ['mobAtk1Dmg', 'mobAtk2Dmg', 'mobAtk3Dmg', 'mobSkill1Dmg', 'mobSkill2Dmg', 'mobSkill3Dmg', 'mobHitDmg', 'mobSkillDmg']
    .forEach((k) => scaleField(m, k, factor));
  // ensure primary lands on target if only atk1 used
  if (Number(m.mobAtk1Dmg) > 0) m.mobAtk1Dmg = target;
  else if (Number(m.mobHitDmg) > 0) m.mobHitDmg = target;
}

function applyBossAtk(m, newBossAtk) {
  const oldPrimary = primaryBossAtk(m);
  const target = Math.max(1, roundNice(newBossAtk));
  const factor = oldPrimary > 0 ? target / oldPrimary : 1;
  ['bossAtk1Dmg', 'bossAtk2Dmg', 'bossAtk3Dmg', 'bossSkill1Dmg', 'bossSkill2Dmg', 'bossSkill3Dmg', 'bossHitDmg', 'bossSkillDmg']
    .forEach((k) => scaleField(m, k, factor));
  if (Number(m.bossAtk1Dmg) > 0) m.bossAtk1Dmg = target;
  else if (Number(m.bossHitDmg) > 0) m.bossHitDmg = target;
}

function main() {
  const src = fs.readFileSync(ZONE_FILE, 'utf8');
  const { maps, start, end } = extractArray(src, 'IDLE_ZONE_CUSTOM_MAPS');

  const near30 = maps.filter((m) => {
    if (isOutlier(m)) return false;
    const L = curveLevel(m);
    return L >= 25 && L <= 30;
  });
  let H30 = median(near30.map((m) => Number(m.monsterHp)));
  let D30 = median(near30.map((m) => primaryMobAtk(m)));
  if (!(H30 > 0)) {
    const le30 = maps.filter((m) => !isOutlier(m) && curveLevel(m) <= 30);
    H30 = median(le30.map((m) => Number(m.monsterHp))) || 10000;
  }
  if (!(D30 > 0)) {
    const le30 = maps.filter((m) => !isOutlier(m) && curveLevel(m) <= 30);
    D30 = median(le30.map((m) => primaryMobAtk(m))) || 80;
  }

  const hp51 = Math.max(160000, Math.round(H30 * 1.5));
  const hpAnchors = [[30, H30], [51, hp51], ...ANCHOR_HP.filter(([L]) => L > 51)];
  // soften later anchors if H30 already high: ensure monotonic
  for (let i = 1; i < hpAnchors.length; i += 1) {
    if (hpAnchors[i][1] < hpAnchors[i - 1][1]) {
      hpAnchors[i][1] = Math.round(hpAnchors[i - 1][1] * 1.35);
    }
  }

  const MOB_ATK_MULT = 3;
  const dmg51 = Math.max(Math.round(D30 * 1.5), Math.round(hp51 * 0.00175));
  const dmgAnchors = [[30, D30], [51, dmg51], [60, Math.round(dmg51 * 1.35)], [70, Math.round(dmg51 * 2.2)], [80, Math.round(dmg51 * 3.5)], [100, Math.round(dmg51 * 6)]];

  const bossAtk30 = Math.max(Math.round(D30 * 8), 800);
  const bossAtkAnchors = [
    [30, bossAtk30],
    [51, 4200],
    [60, 5500],
    [70, 8000],
    [80, 12000],
    [100, 20000],
  ];
  for (let i = 1; i < bossAtkAnchors.length; i += 1) {
    if (bossAtkAnchors[i][1] < bossAtkAnchors[i - 1][1]) {
      bossAtkAnchors[i][1] = Math.round(bossAtkAnchors[i - 1][1] * 1.25);
    }
  }

  const toRescale = maps.filter(shouldRescale);
  // band medians among to-rescale, by bandKey or bandMin-Max
  const bandGroups = new Map();
  toRescale.forEach((m) => {
    const key = String(m.bandKey || `${m.bandMin}-${m.bandMax}` || m.unlockLevel);
    if (!bandGroups.has(key)) bandGroups.set(key, []);
    bandGroups.get(key).push(m);
  });
  const bandHpMed = new Map();
  const bandAtkMed = new Map();
  bandGroups.forEach((list, key) => {
    bandHpMed.set(key, median(list.map((m) => Number(m.monsterHp))) || 1);
    bandAtkMed.set(key, median(list.map((m) => primaryMobAtk(m))) || 1);
  });

  const rows = [];
  toRescale.forEach((m) => {
    const L = curveLevel(m);
    const key = String(m.bandKey || `${m.bandMin}-${m.bandMax}` || m.unlockLevel);
    const before = {
      hp: Number(m.monsterHp) || 0,
      bossHp: Number(m.bossHp) || 0,
      mobAtk: primaryMobAtk(m),
      bossAtk: primaryBossAtk(m),
    };
    const targetHp = interpAnchors(hpAnchors, L);
    const targetMobAtk = interpAnchors(dmgAnchors, L);
    const targetBossAtk = interpAnchors(bossAtkAnchors, L);
    applyMobHp(m, targetHp, bandHpMed.get(key));
    applyMobAtk(m, targetMobAtk * MOB_ATK_MULT, bandAtkMed.get(key));
    applyBossAtk(m, targetBossAtk);
    // force boss hp after atk in case order matters
    m.bossHp = roundNice((Number(m.monsterHp) || 0) * BOSS_HP_MULT);

    rows.push({
      name: m.name,
      mapId: m.mapId,
      L,
      unlockLevel: m.unlockLevel,
      before,
      after: {
        hp: m.monsterHp,
        bossHp: m.bossHp,
        mobAtk: primaryMobAtk(m),
        bossAtk: primaryBossAtk(m),
      },
      ttkMob80k: (m.monsterHp / 80000).toFixed(2),
      ttkBoss80k: (m.bossHp / 80000).toFixed(1),
    });
  });

  const newJson = JSON.stringify(maps, null, 2);
  const out = `${src.slice(0, start)}${newJson}${src.slice(end)}`;
  fs.writeFileSync(ZONE_FILE, out, 'utf8');

  rows.sort((a, b) => a.L - b.L || String(a.mapId).localeCompare(String(b.mapId)));
  const sampleLs = [31, 35, 40, 45, 50, 51, 55, 60, 70, 80, 100];
  const lines = [];
  lines.push('# Zone combat rescale report (post-30)');
  lines.push('');
  lines.push(`- H30 median: **${H30}**`);
  lines.push(`- D30 median: **${D30}**`);
  lines.push(`- HP51 anchor: **${hp51}**`);
  lines.push(`- Rescaled maps: **${rows.length}** / ${maps.length}`);
  lines.push(`- Boss HP: monsterHp × ${BOSS_HP_MULT}`);
  lines.push(`- CD: unchanged`);
  lines.push('');
  lines.push('## HP anchors used');
  lines.push('');
  lines.push('| L | monsterHp |');
  lines.push('|---|-----------|');
  hpAnchors.forEach(([L, hp]) => lines.push(`| ${L} | ${hp} |`));
  lines.push('');
  lines.push('## Sample rows');
  lines.push('');
  lines.push('| L | Map | HP before → after | BossHP before → after | MobAtk | BossAtk | TTK mob@80k | TTK boss@80k |');
  lines.push('|---|-----|-------------------|-----------------------|--------|---------|-------------|--------------|');
  const shown = new Set();
  rows.forEach((r) => {
    const hit = sampleLs.some((s) => Math.abs(r.L - s) <= 2) || /土龍|雲彩|絕壁|森林沉默/.test(r.name);
    if (!hit) return;
    const k = `${r.mapId}`;
    if (shown.has(k)) return;
    shown.add(k);
    lines.push(
      `| ${r.L} | ${r.name} (${r.mapId}) | ${r.before.hp} → ${r.after.hp} | ${r.before.bossHp} → ${r.after.bossHp} | ${r.before.mobAtk} → ${r.after.mobAtk} | ${r.before.bossAtk} → ${r.after.bossAtk} | ${r.ttkMob80k}s | ${r.ttkBoss80k}s |`,
    );
  });
  lines.push('');
  lines.push('## All rescaled (compact)');
  lines.push('');
  rows.forEach((r) => {
    lines.push(`- L${r.L} ${r.name}: HP ${r.before.hp}→${r.after.hp}, boss ${r.before.bossHp}→${r.after.bossHp}, mobAtk ${r.before.mobAtk}→${r.after.mobAtk}, bossAtk ${r.before.bossAtk}→${r.after.bossAtk}`);
  });
  fs.writeFileSync(REPORT_FILE, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Updated ${rows.length} maps. H30=${H30} D30=${D30} hp51=${hp51}`);
  console.log(`Report: ${REPORT_FILE}`);
}

main();
