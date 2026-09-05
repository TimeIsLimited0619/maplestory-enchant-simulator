/**
 * 從 wz-xml/boss/{listId}/ 匯入 BOSS 分體動畫與戰鬥數值。
 * 輸出：
 *   images/idle-bosses/{mobId}/{action}/{frame}.png
 *   js/idleBossMobData.js   （動畫，供 IdleMobAnim）
 *   js/idleBossWzData.js    （HP／攻擊／減傷規則）
 *
 *   node scripts/import-boss-wz.mjs
 *   npm run import:boss
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BOSS_ROOT = path.join(ROOT, 'wz-xml', 'boss');
const OUT_IMG = path.join(ROOT, 'images', 'idle-bosses');
const OUT_MOB_DATA = path.join(ROOT, 'js', 'idleBossMobData.js');
const OUT_WZ_DATA = path.join(ROOT, 'js', 'idleBossWzData.js');

const SKIP_TOP = new Set(['info']);

/** listId → 分體設定 */
const BOSS_MANIFEST = {
  '0': {
    name: '巴洛古',
    parts: [
      { role: 'body', mobId: '8830000', z: 10 },
      { role: 'hand', mobId: '8830001', z: 30, handIndex: 0 },
      { role: 'hand', mobId: '8830002', z: 31, handIndex: 1 },
      { role: 'head', mobId: '8830003', z: 20 },
    ],
    // 階段視覺／残骸／獎勵箱（僅匯入動畫＋數值）
    extraMobs: ['8830004', '8830005', '8830006', '8830014'],
    hpMult: 1,
    dmgMult: 1,
    cdMult: 1,
  },
  /**
   * 殘暴炎魔：stats 用台版 9451xxx；視覺多 outlink 到 8800／9400 canvas。
   * 本體三態 9451120–22；八臂 9451123–30。94009xx／2600631 不當可打部位（不列入）。
   */
  '1': {
    name: '殘暴炎魔',
    parts: [
      { role: 'body', mobId: '9451120', z: 10 },
      { role: 'body', mobId: '9451121', z: 10 },
      { role: 'body', mobId: '9451122', z: 10 },
      { role: 'hand', mobId: '9451123', z: 30, handIndex: 0 },
      { role: 'hand', mobId: '9451124', z: 31, handIndex: 1 },
      { role: 'hand', mobId: '9451125', z: 32, handIndex: 2 },
      { role: 'hand', mobId: '9451126', z: 33, handIndex: 3 },
      { role: 'hand', mobId: '9451127', z: 34, handIndex: 4 },
      { role: 'hand', mobId: '9451128', z: 35, handIndex: 5 },
      { role: 'hand', mobId: '9451129', z: 36, handIndex: 6 },
      { role: 'hand', mobId: '9451130', z: 37, handIndex: 7 },
    ],
    extraMobs: [],
    hpMult: 1,
    dmgMult: 1,
    cdMult: 1,
  },
};

function padId(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits ? digits.padStart(7, '0').slice(-7) : '';
}

function parseAttrs(raw) {
  const out = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(raw || ''))) out[m[1]] = m[2];
  return out;
}

function parseVector(value) {
  const m = String(value || '').match(/(-?\d+)\s*,\s*(-?\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}

function parseWzXml(xml) {
  const root = { name: '', kind: 'dir', children: [], attrs: {}, value: null };
  const stack = [root];
  const re = /<(\/)?(dir|img|png|vector|string|uol|int32|int16|int8|int|short|float|double|single)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(xml))) {
    const closing = !!m[1];
    const tag = m[2];
    const rawAttrs = String(m[3] || '').replace(/\/\s*$/, '');
    const selfClose = /\/\s*$/.test(m[3] || '');
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs = parseAttrs(rawAttrs);
    const node = {
      name: attrs.name || '',
      kind: tag,
      attrs,
      value: attrs.value,
      children: [],
    };
    stack[stack.length - 1].children.push(node);
    if (!selfClose && tag !== 'vector' && tag !== 'string' && tag !== 'uol'
      && tag !== 'int32' && tag !== 'int16' && tag !== 'int8' && tag !== 'int'
      && tag !== 'short' && tag !== 'float' && tag !== 'double' && tag !== 'single') {
      stack.push(node);
    }
  }
  return root.children[0] || root;
}

function findChild(node, name) {
  return (node.children || []).find((c) => c.name === name) || null;
}

function nodePath(node, parts) {
  let cur = node;
  for (const p of parts) {
    if (!cur) return null;
    cur = findChild(cur, p);
  }
  return cur;
}

function resolveUol(imgRoot, fromParts, uolValue) {
  const bits = String(uolValue || '').split('/').filter(Boolean);
  const stack = fromParts.slice();
  for (const b of bits) {
    if (b === '..') stack.pop();
    else stack.push(b);
  }
  let target = nodePath(imgRoot, stack);
  let guard = 0;
  while (target && target.kind === 'uol' && guard < 16) {
    const parentParts = stack.slice(0, -1);
    target = resolveUol(imgRoot, parentParts, target.value);
    guard += 1;
  }
  return target;
}

function pngIndexFromTree(imgRoot) {
  const index = Object.create(null);
  function walk(node, parts) {
    if (!node) return;
    if (node.kind === 'png') {
      index[parts.concat(node.name).join('/')] = node;
    }
    (node.children || []).forEach((c) => {
      if (c.kind === 'png') walk(c, parts);
      else if (c.kind === 'dir' || c.kind === 'img') walk(c, parts.concat(c.name));
    });
  }
  walk(imgRoot, []);
  return index;
}

function decodePng(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 32 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return buf;
}

function isCanvasFileName(name) {
  return /_canvas/i.test(String(name || ''));
}

function isMobMainFile(name) {
  const n = String(name || '');
  if (!/\.img\.xml$/i.test(n) && !/\.xml$/i.test(n)) return false;
  if (isCanvasFileName(n)) return false;
  return /^Mob\./i.test(n) || /^\d{7}/.test(n);
}

function mobIdFromFile(name) {
  const m = String(name).match(/(?:Mob\.)?(\d{7})/i)
    || String(name).match(/(\d{5,8})/);
  return m ? padId(m[1]) : '';
}

function canvasFileFor(dir, mobId) {
  const names = [
    `Mob._Canvas.${mobId}.img.xml`,
    `Mob._Canvas.${mobId}.xml`,
  ];
  for (const name of names) {
    const p = path.join(dir, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  if (!fs.existsSync(dir)) return null;
  for (const name of fs.readdirSync(dir)) {
    if (!isCanvasFileName(name)) continue;
    if (mobIdFromFile(name) === mobId) return path.join(dir, name);
  }
  return null;
}

function outlinkKey(outlink) {
  const s = String(outlink || '');
  const i = s.indexOf('.img/');
  return i >= 0 ? s.slice(i + 5) : s.replace(/^.*?\.img\//, '');
}

function outlinkMobId(outlink) {
  const s = String(outlink || '');
  const m = s.match(/Mob\/_Canvas\/(\d+)\.img\//i)
    || s.match(/\/_Canvas\/(\d+)\.img\//i)
    || s.match(/(?:^|\/)(\d{7})\.img\//);
  return m ? padId(m[1]) : '';
}

function loadCanvasIndex(dir, mobId, cache) {
  const key = `${dir}::${mobId}`;
  if (cache.has(key)) return cache.get(key);
  const p = canvasFileFor(dir, mobId);
  let index = null;
  if (p) index = pngIndexFromTree(parseWzXml(fs.readFileSync(p, 'utf8')));
  cache.set(key, index);
  return index;
}

function pngMeta(pngNode) {
  const originNode = findChild(pngNode, 'origin');
  const delayNode = findChild(pngNode, 'delay');
  const outlink = findChild(pngNode, '_outlink');
  const delayRaw = delayNode?.value;
  const delay = delayRaw != null && delayRaw !== '' ? Number(delayRaw) : null;
  return {
    origin: parseVector(originNode?.value),
    delay: Number.isFinite(delay) && delay > 0 ? delay : null,
    outlink: outlink?.value || '',
  };
}

function resolvePngBuf(pngNode, selfCanvasIndex, opts = {}) {
  const meta = pngMeta(pngNode);
  let buf = decodePng(pngNode.value);
  const tiny = !buf || buf.length < 200;
  if (!tiny) return { buf, meta };
  if (!meta.outlink) return { buf, meta };

  const key = outlinkKey(meta.outlink);
  const linkId = outlinkMobId(meta.outlink);
  const selfId = opts.selfId || '';
  let index = selfCanvasIndex;

  if (linkId && selfId && linkId !== selfId && opts.canvasCache && opts.bossDir) {
    index = loadCanvasIndex(opts.bossDir, linkId, opts.canvasCache) || selfCanvasIndex;
  }

  const linked = index?.[key];
  if (linked) {
    const fromCanvas = decodePng(linked.value);
    if (fromCanvas) return { buf: fromCanvas, meta };
  }
  return { buf, meta };
}

function collectFrames(actionNode, actionName) {
  const frames = [];
  function walk(node, parts) {
    (node.children || []).forEach((c) => {
      if ((c.kind === 'png' || c.kind === 'uol') && /^\d+$/.test(c.name)) {
        const actionKey = parts.length ? `${actionName}/${parts.join('/')}` : actionName;
        frames.push({
          actionKey,
          frame: Number(c.name),
          node: c,
          fromParts: [actionName].concat(parts),
        });
      } else if (c.kind === 'dir' || c.kind === 'img') {
        walk(c, parts.concat(c.name));
      }
    });
  }
  walk(actionNode, []);
  return frames;
}

function frameOwnedByAction(mobId, actionKey, entry) {
  if (!entry?.src || !actionKey) return false;
  return String(entry.src).includes(`/${mobId}/${actionKey}/`);
}

function trimTrailingForeignFrames(mobId, actionKey, frames) {
  if (!Array.isArray(frames) || !/^(attack|skill)\d*$/i.test(actionKey)) return frames;
  let max = frames.length - 1;
  while (max >= 0) {
    if (!frames[max]) {
      max -= 1;
      continue;
    }
    if (frameOwnedByAction(mobId, actionKey, frames[max])) break;
    max -= 1;
  }
  return frames.slice(0, max + 1);
}

function ensureSlot(mobActions, actionKey, frame) {
  if (!mobActions[actionKey]) mobActions[actionKey] = [];
  const slot = mobActions[actionKey];
  while (slot.length <= frame) slot.push(null);
  return slot;
}

function writeFramePng(mobId, actionKey, frame, buf) {
  const dir = path.join(OUT_IMG, mobId, ...actionKey.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${frame}.png`);
  fs.writeFileSync(file, buf);
  return `images/idle-bosses/${mobId}/${actionKey}/${frame}.png`;
}

function extractActionInfoMeta(actionDir) {
  const info = findChild(actionDir, 'info');
  if (!info) return null;
  const out = {};
  for (const key of ['attackAfter', 'effectAfter']) {
    const node = findChild(info, key);
    if (node == null || node.value === '' || node.value == null) continue;
    const n = Number(node.value);
    if (Number.isFinite(n)) out[key] = n;
  }
  return Object.keys(out).length ? out : null;
}

function intChild(parent, name, fallback = 0) {
  const n = Number(findChild(parent, name)?.value);
  return Number.isFinite(n) ? n : fallback;
}

function extractCombatStats(imgRoot) {
  const info = findChild(imgRoot, 'info');
  if (!info) return null;
  const attacks = [];
  const atkRoot = findChild(info, 'attack');
  for (const child of atkRoot?.children || []) {
    if (child.kind !== 'dir') continue;
    const actionNum = intChild(child, 'action', 0);
    const ratio = intChild(child, 'attackRatio', 100);
    const magic = intChild(child, 'magic', 0) === 1;
    attacks.push({
      index: Number(child.name) || 0,
      action: actionNum,
      actionKey: actionNum > 0 ? `attack${actionNum}` : '',
      attackRatio: ratio,
      type: intChild(child, 'type', 0),
      magic,
      conMP: intChild(child, 'conMP', 0),
      elemAttr: findChild(child, 'elemAttr')?.value || '',
      disease: intChild(child, 'disease', 0) || undefined,
      level: intChild(child, 'level', 0) || undefined,
    });
  }
  const skills = [];
  const skillRoot = findChild(info, 'skill');
  for (const child of skillRoot?.children || []) {
    if (child.kind !== 'dir') continue;
    skills.push({
      index: Number(child.name) || 0,
      skill: intChild(child, 'skill', 0),
      action: intChild(child, 'action', 0),
      level: intChild(child, 'level', 0),
      effectAfter: intChild(child, 'effectAfter', 0),
    });
  }
  return {
    level: intChild(info, 'level', 0),
    maxHP: intChild(info, 'maxHP', 0),
    maxMP: intChild(info, 'maxMP', 0),
    PADamage: intChild(info, 'PADamage', 0),
    MADamage: intChild(info, 'MADamage', 0),
    PDDamage: intChild(info, 'PDDamage', 0),
    MDDamage: intChild(info, 'MDDamage', 0),
    PDRate: intChild(info, 'PDRate', 0),
    MDRate: intChild(info, 'MDRate', 0),
    acc: intChild(info, 'acc', 0),
    eva: intChild(info, 'eva', 0),
    bodyAttack: intChild(info, 'bodyAttack', 0) === 1,
    firstAttack: intChild(info, 'firstAttack', 0) === 1,
    boss: intChild(info, 'boss', 0) === 1,
    hpRecovery: intChild(info, 'hpRecovery', 0),
    mpRecovery: intChild(info, 'mpRecovery', 0),
    attacks,
    skills,
  };
}

function actionDurationMs(mobActions, actionKey) {
  const frames = mobActions?.[actionKey];
  if (!Array.isArray(frames)) return 0;
  let sum = 0;
  for (const f of frames) {
    if (!f) continue;
    sum += Number(f.delay) > 0 ? Number(f.delay) : 120;
  }
  return sum;
}

function enrichAttacksWithCd(stats, mobActions) {
  if (!stats) return stats;
  const attacks = (stats.attacks || []).map((a) => {
    const key = a.actionKey;
    const animMs = key ? actionDurationMs(mobActions, key) : 0;
    const base = a.magic ? stats.MADamage : stats.PADamage;
    const dmg = Math.floor((Number(base) || 0) * (Number(a.attackRatio) || 100) / 100);
    return { ...a, animMs, dmg };
  });
  const skillAnims = {};
  Object.keys(mobActions || {}).forEach((k) => {
    if (/^skill\d+$/i.test(k)) skillAnims[k] = actionDurationMs(mobActions, k);
  });
  return { ...stats, attacks, skillAnimMs: skillAnims };
}

function importMobFile(bossDir, mobId, canvasCache, dryRun) {
  const mainName = `Mob.${mobId}.img.xml`;
  const mainPath = path.join(bossDir, mainName);
  if (!fs.existsSync(mainPath)) {
    console.warn(`  缺主檔：${mainName}`);
    return null;
  }
  const xml = fs.readFileSync(mainPath, 'utf8');
  const imgRoot = parseWzXml(xml);
  const canvasIndex = loadCanvasIndex(bossDir, mobId, canvasCache);
  if (!canvasIndex) console.warn(`  缺 Canvas：${mobId}`);

  const mobActions = Object.create(null);
  const pngRef = new Map();
  const actionMeta = Object.create(null);
  const resolveOpts = { selfId: mobId, canvasCache, bossDir };

  const actionDirs = (imgRoot.children || []).filter(
    (c) => (c.kind === 'dir' || c.kind === 'img') && c.name && !SKIP_TOP.has(c.name),
  );
  const collectedAll = [];
  for (const actionDir of actionDirs) {
    collectedAll.push(...collectFrames(actionDir, actionDir.name));
    const infoMeta = extractActionInfoMeta(actionDir);
    if (infoMeta) actionMeta[actionDir.name] = infoMeta;
  }

  let frameCount = 0;
  for (const { actionKey, frame, node } of collectedAll) {
    if (node.kind !== 'png') continue;
    const { buf, meta } = resolvePngBuf(node, canvasIndex, resolveOpts);
    if (!buf) continue;
    let src = `images/idle-bosses/${mobId}/${actionKey}/${frame}.png`;
    if (!dryRun) src = writeFramePng(mobId, actionKey, frame, buf);
    const entry = { origin: meta.origin, delay: meta.delay || 120, src };
    ensureSlot(mobActions, actionKey, frame)[frame] = entry;
    pngRef.set(node, entry);
    frameCount += 1;
  }

  let uolPending = collectedAll.filter((e) => e.node.kind === 'uol');
  for (let pass = 0; pass < 8 && uolPending.length; pass += 1) {
    const next = [];
    for (const item of uolPending) {
      const target = resolveUol(imgRoot, item.fromParts, item.node.value);
      if (!target) {
        next.push(item);
        continue;
      }
      let resolved = pngRef.get(target);
      if (!resolved && target.kind === 'png') {
        const { buf, meta } = resolvePngBuf(target, canvasIndex, resolveOpts);
        if (buf) {
          let src = `images/idle-bosses/${mobId}/${item.actionKey}/${item.frame}.png`;
          if (!dryRun) src = writeFramePng(mobId, item.actionKey, item.frame, buf);
          resolved = { origin: meta.origin, delay: meta.delay || 120, src };
          pngRef.set(target, resolved);
        }
      }
      if (!resolved) {
        next.push(item);
        continue;
      }
      ensureSlot(mobActions, item.actionKey, item.frame)[item.frame] = {
        origin: resolved.origin,
        delay: resolved.delay,
        src: resolved.src,
      };
      frameCount += 1;
    }
    if (next.length === uolPending.length) break;
    uolPending = next;
  }

  Object.keys(mobActions).forEach((key) => {
    mobActions[key] = trimTrailingForeignFrames(
      mobId,
      key,
      mobActions[key].map((f) => f || null),
    );
  });
  if (Object.keys(actionMeta).length) mobActions._meta = actionMeta;

  const stats = enrichAttacksWithCd(extractCombatStats(imgRoot), mobActions);
  console.log(`  ${mobId}  frames≈${frameCount}  actions=${Object.keys(mobActions).filter((k) => k !== '_meta').join(',')}`);
  return { mobActions, stats, frameCount };
}

function buildWzEntry(listId, manifest, partStats) {
  const parts = (manifest.parts || []).map((p) => {
    const st = partStats[p.mobId] || {};
    return {
      role: p.role,
      mobId: padId(p.mobId),
      z: p.z ?? 0,
      handIndex: p.handIndex,
      ...st,
    };
  });
  return {
    listId: String(listId),
    name: manifest.name || `BOSS ${listId}`,
    parts,
    extraMobs: (manifest.extraMobs || []).map((id) => padId(id)),
    hpMult: Number(manifest.hpMult) > 0 ? Number(manifest.hpMult) : 1,
    dmgMult: Number(manifest.dmgMult) > 0 ? Number(manifest.dmgMult) : 1,
    cdMult: Number(manifest.cdMult) > 0 ? Number(manifest.cdMult) : 1,
  };
}

export function importBosses(opts = {}) {
  const dryRun = !!opts.dryRun;
  if (!fs.existsSync(BOSS_ROOT)) {
    console.log('BOSS：找不到 wz-xml/boss/');
    return { bosses: 0, frames: 0 };
  }

  const mobData = Object.create(null);
  const wzData = Object.create(null);
  const canvasCache = new Map();
  let totalFrames = 0;
  let bossCount = 0;

  for (const listId of Object.keys(BOSS_MANIFEST).sort((a, b) => Number(a) - Number(b))) {
    const manifest = BOSS_MANIFEST[listId];
    const bossDir = path.join(BOSS_ROOT, String(listId));
    if (!fs.existsSync(bossDir)) {
      console.warn(`略過 ${listId}：無資料夾 ${bossDir}`);
      continue;
    }
    console.log(`── BOSS ${listId} ${manifest.name || ''} ──`);
    const partStats = Object.create(null);
    const importIds = new Set();
    for (const part of manifest.parts || []) importIds.add(padId(part.mobId));
    for (const id of manifest.extraMobs || []) importIds.add(padId(id));
    for (const mobId of [...importIds].sort()) {
      const imported = importMobFile(bossDir, mobId, canvasCache, dryRun);
      if (!imported) continue;
      mobData[mobId] = imported.mobActions;
      partStats[mobId] = imported.stats;
      totalFrames += imported.frameCount;
    }
    wzData[String(listId)] = buildWzEntry(listId, manifest, partStats);
    bossCount += 1;
  }

  if (dryRun) {
    console.log(`BOSS dry-run：${bossCount} 隻、約 ${totalFrames} 幀`);
    return { bosses: bossCount, frames: totalFrames };
  }

  const mobJs = `/** 由 scripts/import-boss-wz.mjs 從 wz-xml/boss/ 產生。不要手改。 */\n`
    + `const IDLE_BOSS_MOB_DATA = ${JSON.stringify(mobData)};\n`
    + `if (typeof window !== 'undefined') window.IDLE_BOSS_MOB_DATA = IDLE_BOSS_MOB_DATA;\n`;
  fs.writeFileSync(OUT_MOB_DATA, mobJs);

  const helpers = `
/** 本體受到傷害倍率：雙手都在=0（無敵），一隻手=0.5，雙手都死=1 */
function idleBossBodyIncomingMult(listId, livingHandCount) {
  const row = (typeof IDLE_BOSS_WZ !== 'undefined' ? IDLE_BOSS_WZ : {})[String(listId)];
  const rule = row && row.bodyMitigation;
  if (!rule || rule.type !== 'perLivingHand') return 1;
  const per = Number(rule.perLivingHandDr);
  const p = Number.isFinite(per) ? per : 0.5;
  const n = Math.max(0, Math.floor(Number(livingHandCount) || 0));
  const dr = Math.min(1, n * p);
  return Math.max(0, 1 - dr);
}
function idleBossLivingHandCount(partsState) {
  if (!partsState || typeof partsState !== 'object') return 0;
  return Object.keys(partsState).filter((k) => {
    const p = partsState[k];
    return p && p.role === 'hand' && !p.dead && (Number(p.hp) || 0) > 0;
  }).length;
}
`;

  const wzJs = `/** 由 scripts/import-boss-wz.mjs 從 wz-xml/boss/ 產生。不要手改。 */\n`
    + `const IDLE_BOSS_WZ = ${JSON.stringify(wzData, null, 2)};\n`
    + helpers
    + `if (typeof window !== 'undefined') {\n`
    + `  window.IDLE_BOSS_WZ = IDLE_BOSS_WZ;\n`
    + `  window.idleBossBodyIncomingMult = idleBossBodyIncomingMult;\n`
    + `  window.idleBossLivingHandCount = idleBossLivingHandCount;\n`
    + `}\n`;
  fs.writeFileSync(OUT_WZ_DATA, wzJs);

  console.log(`BOSS：${bossCount} 隻、${totalFrames} 幀 → ${path.relative(ROOT, OUT_MOB_DATA)}`);
  console.log(`數值 → ${path.relative(ROOT, OUT_WZ_DATA)}`);
  return { bosses: bossCount, frames: totalFrames };
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  importBosses({ dryRun: process.argv.includes('--dry-run') });
}
