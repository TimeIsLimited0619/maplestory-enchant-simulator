/**
 * 補齊漏掉／跑掉的 post-30 平衡：
 * - 奇幻村龍／寺院 c163–c171（原本 L<=30 被跳過）
 * - 秘密森林埃羅汀 c177–c186
 * - 跑掉的 c131、c162
 *
 * 不重跑已正確的其他圖。Boss HP = monsterHp × 15；小怪傷含 ×3。
 * 用法：node scripts/fix-missed-zone-combat.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZONE_FILE = path.join(__dirname, '..', 'js', 'idleZonesData.js');
const BOSS_HP_MULT = 15;
const MOB_ATK_MULT = 3;

const H30 = 8950;
const HP_ANCHORS = [
  [30, H30],
  [51, 160000],
  [60, 280000],
  [70, 700000],
  [80, 1800000],
  [100, 6000000],
];
const D30 = 365;
const dmg51 = Math.max(Math.round(D30 * 1.5), Math.round(160000 * 0.00175));
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

/** 報告 after（小怪傷為 ×3 前）；此腳本會再 ×3 */
const REPORT_AFTER = {
  c131: { L: 35, hp: 17800, bossHp: 267000, mobAtk: 400, bossAtk: 3200 },
  c162: { L: 32, hp: 11800, bossHp: 177000, mobAtk: 380, bossAtk: 3000 },
  c177: { L: 45, hp: 36900, bossHp: 554000, mobAtk: 400, bossAtk: 3800 },
  c178: { L: 40, hp: 22300, bossHp: 335000, mobAtk: 380, bossAtk: 3450 },
  c179: { L: 40, hp: 26000, bossHp: 390000, mobAtk: 400, bossAtk: 3450 },
  c180: { L: 40, hp: 29800, bossHp: 447000, mobAtk: 415, bossAtk: 3450 },
  c181: { L: 40, hp: 33500, bossHp: 503000, mobAtk: 435, bossAtk: 3450 },
  c182: { L: 40, hp: 37200, bossHp: 558000, mobAtk: 450, bossAtk: 3450 },
  c183: { L: 40, hp: 40900, bossHp: 614000, mobAtk: 470, bossAtk: 3450 },
  c184: { L: 40, hp: 44600, bossHp: 669000, mobAtk: 490, bossAtk: 3450 },
  c185: { L: 40, hp: 48300, bossHp: 725000, mobAtk: 505, bossAtk: 3450 },
  c186: { L: 40, hp: 55800, bossHp: 837000, mobAtk: 525, bossAtk: 3450 },
};

const DRAGON_IDS = ['c163', 'c164', 'c165', 'c166', 'c167', 'c168', 'c169', 'c170', 'c171'];

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

function setMobAtkAbsolute(m, target) {
  const oldPrimary = primaryMobAtk(m);
  const t = Math.max(1, roundNice(target));
  if (oldPrimary > 0) {
    const factor = t / oldPrimary;
    ['mobAtk1Dmg', 'mobAtk2Dmg', 'mobAtk3Dmg', 'mobSkill1Dmg', 'mobSkill2Dmg', 'mobSkill3Dmg', 'mobHitDmg', 'mobSkillDmg']
      .forEach((k) => scaleField(m, k, factor));
  }
  if (Number(m.mobAtk1Dmg) > 0 || Object.prototype.hasOwnProperty.call(m, 'mobAtk1Dmg')) {
    m.mobAtk1Dmg = t;
  } else if (Number(m.mobHitDmg) > 0) {
    m.mobHitDmg = t;
  } else {
    m.mobAtk1Dmg = t;
  }
}

function setBossAtkAbsolute(m, target) {
  const oldPrimary = primaryBossAtk(m);
  const t = Math.max(1, roundNice(target));
  if (oldPrimary > 0) {
    const factor = t / oldPrimary;
    ['bossAtk1Dmg', 'bossAtk2Dmg', 'bossAtk3Dmg', 'bossSkill1Dmg', 'bossSkill2Dmg', 'bossSkill3Dmg', 'bossHitDmg', 'bossSkillDmg']
      .forEach((k) => scaleField(m, k, factor));
  }
  if (Number(m.bossAtk1Dmg) > 0 || Object.prototype.hasOwnProperty.call(m, 'bossAtk1Dmg')) {
    m.bossAtk1Dmg = t;
  } else if (Number(m.bossHitDmg) > 0) {
    m.bossHitDmg = t;
  } else {
    m.bossAtk1Dmg = t;
  }
}

function applyReportRow(m, row) {
  const before = {
    hp: Number(m.monsterHp) || 0,
    bossHp: Number(m.bossHp) || 0,
    mobAtk: primaryMobAtk(m),
    bossAtk: primaryBossAtk(m),
  };
  m.monsterHp = row.hp;
  m.bossHp = roundNice(row.hp * BOSS_HP_MULT);
  setMobAtkAbsolute(m, row.mobAtk * MOB_ATK_MULT);
  setBossAtkAbsolute(m, row.bossAtk);
  return {
    id: m.mapId,
    name: m.name,
    L: row.L,
    before,
    after: {
      hp: m.monsterHp,
      bossHp: m.bossHp,
      mobAtk: primaryMobAtk(m),
      bossAtk: primaryBossAtk(m),
    },
  };
}

function applyDragonBand(maps) {
  const dragons = DRAGON_IDS.map((id) => maps.find((m) => m.mapId === id)).filter(Boolean);
  if (dragons.length !== DRAGON_IDS.length) {
    throw new Error(`missing dragon maps: want ${DRAGON_IDS.length} got ${dragons.length}`);
  }
  // 與土龍同帶 30–35 → curveLevel 32；用舊 HP 相對比例拉開進度
  const L = 32;
  const targetHp = interpAnchors(HP_ANCHORS, L);
  const targetMobAtk = interpAnchors(DMG_ANCHORS, L) * MOB_ATK_MULT;
  const targetBossAtk = interpAnchors(BOSS_ATK_ANCHORS, L);
  const hpMed = median(dragons.map((m) => Number(m.monsterHp) || 0));
  const atkMed = median(dragons.map((m) => primaryMobAtk(m))) || 1;

  return dragons.map((m) => {
    const before = {
      hp: Number(m.monsterHp) || 0,
      bossHp: Number(m.bossHp) || 0,
      mobAtk: primaryMobAtk(m),
      bossAtk: primaryBossAtk(m),
    };
    // 補上 band，之後腳本不會再因 L=30 漏掉
    m.bandMin = 30;
    m.bandMax = 35;
    if (!m.bandName) m.bandName = '奇幻村';

    const hp = roundNice(targetHp * (before.hp / hpMed));
    m.monsterHp = hp;
    m.bossHp = roundNice(hp * BOSS_HP_MULT);

    const mobAtk = roundNice(targetMobAtk * (before.mobAtk / atkMed));
    setMobAtkAbsolute(m, mobAtk);
    setBossAtkAbsolute(m, targetBossAtk);

    return {
      id: m.mapId,
      name: m.name,
      L,
      before,
      after: {
        hp: m.monsterHp,
        bossHp: m.bossHp,
        mobAtk: primaryMobAtk(m),
        bossAtk: primaryBossAtk(m),
      },
    };
  });
}

function main() {
  const src = fs.readFileSync(ZONE_FILE, 'utf8');
  const { maps, start, end } = extractArray(src, 'IDLE_ZONE_CUSTOM_MAPS');
  const byId = new Map(maps.map((m) => [m.mapId, m]));
  const rows = [];

  Object.entries(REPORT_AFTER).forEach(([id, row]) => {
    const m = byId.get(id);
    if (!m) throw new Error(`missing map ${id}`);
    rows.push(applyReportRow(m, row));
  });

  rows.push(...applyDragonBand(maps));

  const out = `${src.slice(0, start)}${JSON.stringify(maps, null, 2)}${src.slice(end)}`;
  fs.writeFileSync(ZONE_FILE, out, 'utf8');

  rows.sort((a, b) => a.L - b.L || a.id.localeCompare(b.id));
  console.log(`Fixed ${rows.length} maps`);
  rows.forEach((r) => {
    console.log(
      `L${r.L} ${r.id} ${r.name}: HP ${r.before.hp}→${r.after.hp}, boss ${r.before.bossHp}→${r.after.bossHp}, mobAtk ${r.before.mobAtk}→${r.after.mobAtk}, bossAtk ${r.before.bossAtk}→${r.after.bossAtk}`,
    );
  });
}

main();
