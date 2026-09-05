/**
 * 從 wz-xml/mob/ 匯入怪物動畫（含巢狀 effect 等多層）。
 * 主檔 Mob.{id}.img.xml 提供 origin／delay／_outlink；
 * 像素來自 Mob._Canvas.{id}.img.xml。
 * 若 _outlink 指向其他怪物編號，會警告並嘗試讀取對方 Canvas。
 *
 * 輸出：
 *   images/idle-mobs/{id}/{actionPath}/{frame}.png
 *   js/idleMobData.js
 *
 *   node scripts/import-mob-wz.mjs
 *   npm run import:mob
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MOB_ROOT = path.join(ROOT, 'wz-xml', 'mob');
const OUT_IMG = path.join(ROOT, 'images', 'idle-mobs');
const OUT_DATA = path.join(ROOT, 'js', 'idleMobData.js');

const SKIP_TOP = new Set(['info']);

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
  const re = /<(\/)?(dir|img|png|vector|string|uol|int32|int16|int8|int|short|float|double)\b([^>]*)>/g;
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
      && tag !== 'short' && tag !== 'float' && tag !== 'double') {
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

function canvasFileFor(mobId) {
  const names = [
    `Mob._Canvas.${mobId}.img.xml`,
    `Mob._Canvas.${mobId}.xml`,
    `_Canvas.${mobId}.img.xml`,
  ];
  for (const name of names) {
    const p = path.join(MOB_ROOT, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  if (!fs.existsSync(MOB_ROOT)) return null;
  for (const name of fs.readdirSync(MOB_ROOT)) {
    if (!isCanvasFileName(name)) continue;
    if (mobIdFromFile(name) === mobId) return path.join(MOB_ROOT, name);
  }
  return null;
}

function outlinkKey(outlink) {
  const s = String(outlink || '');
  const i = s.indexOf('.img/');
  return i >= 0 ? s.slice(i + 5) : s.replace(/^.*?\.img\//, '');
}

/** 從 _outlink 抽出 Canvas 所屬怪物編號（可能與本檔不同） */
function outlinkMobId(outlink) {
  const s = String(outlink || '');
  const m = s.match(/Mob\/_Canvas\/(\d+)\.img\//i)
    || s.match(/\/_Canvas\/(\d+)\.img\//i)
    || s.match(/(?:^|\/)(\d{7})\.img\//);
  return m ? padId(m[1]) : '';
}

function loadCanvasIndex(mobId, cache) {
  if (cache.has(mobId)) return cache.get(mobId);
  const p = canvasFileFor(mobId);
  let index = null;
  if (p) {
    index = pngIndexFromTree(parseWzXml(fs.readFileSync(p, 'utf8')));
  }
  cache.set(mobId, index);
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

/**
 * @param {object} pngNode
 * @param {object|null} selfCanvasIndex 本怪 Canvas
 * @param {{ selfId?: string, canvasCache?: Map<string, object|null>, onCrossRef?: (toId: string, assetPath: string) => void }} [opts]
 */
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

  if (linkId && selfId && linkId !== selfId) {
    opts.onCrossRef?.(linkId, key);
    if (opts.canvasCache) {
      index = loadCanvasIndex(linkId, opts.canvasCache) || selfCanvasIndex;
    }
  }

  const linked = index?.[key];
  if (linked) {
    const fromCanvas = decodePng(linked.value);
    if (fromCanvas) return { buf: fromCanvas, meta };
  }
  return { buf, meta };
}

/** 彙整跨怪引用：toId → actionPath → 幀數 */
function noteCrossRef(bag, toId, assetPath) {
  if (!bag[toId]) bag[toId] = Object.create(null);
  const actionPath = String(assetPath || '').replace(/\/\d+$/, '') || assetPath;
  bag[toId][actionPath] = (bag[toId][actionPath] || 0) + 1;
}

function formatCrossRefWarn(selfId, bag) {
  const lines = [];
  for (const toId of Object.keys(bag).sort()) {
    const paths = bag[toId];
    const parts = Object.keys(paths).sort().map((p) => `${p}×${paths[p]}`);
    lines.push(`  ${selfId}  引用其他怪圖 → ${toId}（${parts.join(', ')}）`);
  }
  return lines;
}

/**
 * 收集動作底下所有數字幀 png／uol（含 info/effect 等巢狀路徑）。
 * actionKey 例：stand、attack1、attack1/info/effect
 */
function collectFrames(actionNode, actionName) {
  const frames = [];
  function walk(node, parts) {
    (node.children || []).forEach((c) => {
      if ((c.kind === 'png' || c.kind === 'uol') && /^\d+$/.test(c.name)) {
        const actionKey = parts.length ? `${actionName}/${parts.join('/')}` : actionName;
        const fromParts = [actionName].concat(parts);
        frames.push({
          actionKey,
          frame: Number(c.name),
          node: c,
          fromParts,
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

/** 攻擊／技能尾段連到 stand 的 uol 不納入播放（避免閃爍） */
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
  return `images/idle-mobs/${mobId}/${actionKey}/${frame}.png`;
}

function extractActionInfoMeta(actionDir) {
  const info = findChild(actionDir, 'info');
  if (!info) return null;
  const out = {};
  const attackAfter = findChild(info, 'attackAfter');
  const effectAfter = findChild(info, 'effectAfter');
  if (attackAfter != null && attackAfter.value !== '' && attackAfter.value != null) {
    const n = Number(attackAfter.value);
    if (Number.isFinite(n)) out.attackAfter = n;
  }
  if (effectAfter != null && effectAfter.value !== '' && effectAfter.value != null) {
    const n = Number(effectAfter.value);
    if (Number.isFinite(n)) out.effectAfter = n;
  }
  return Object.keys(out).length ? out : null;
}

/** info/skill 的 action／effectAfter → skill1～3 出傷時機 */
function extractMobSkillMeta(imgRoot) {
  const skillRoot = nodePath(imgRoot, ['info', 'skill']);
  if (!skillRoot) return null;
  const out = Object.create(null);
  for (const child of skillRoot.children || []) {
    if (!child.name || child.kind !== 'dir') continue;
    const actionNum = Number(findChild(child, 'action')?.value);
    if (!Number.isFinite(actionNum) || actionNum < 1) continue;
    const skillKey = `skill${actionNum}`;
    const effectAfter = findChild(child, 'effectAfter');
    if (effectAfter == null || effectAfter.value === '' || effectAfter.value == null) continue;
    const n = Number(effectAfter.value);
    if (!Number.isFinite(n) || n <= 0) continue;
    const prev = out[skillKey]?.effectAfter;
    if (prev == null || n < prev) out[skillKey] = { effectAfter: n };
  }
  return Object.keys(out).length ? out : null;
}

function listMainFiles() {
  if (!fs.existsSync(MOB_ROOT)) return [];
  return fs.readdirSync(MOB_ROOT)
    .filter(isMobMainFile)
    .map((name) => ({ name, id: mobIdFromFile(name), path: path.join(MOB_ROOT, name) }))
    .filter((f) => f.id)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function importMobs(opts = {}) {
  const dryRun = !!opts.dryRun;
  const files = listMainFiles();
  if (!files.length) {
    console.log('怪物：wz-xml/mob/ 沒有 Mob.*.img.xml（略過 _Canvas）');
    return { mobs: 0, frames: 0 };
  }

  const data = Object.create(null);
  let frameCount = 0;
  let missingCanvas = 0;
  let missingPixels = 0;
  /** @type {Map<string, object|null>} */
  const canvasCache = new Map();
  /** @type {{ selfId: string, toId: string, paths: Record<string, number> }[]} */
  const allCrossRefs = [];

  for (const file of files) {
    const xml = fs.readFileSync(file.path, 'utf8');
    const imgRoot = parseWzXml(xml);
    let canvasIndex = loadCanvasIndex(file.id, canvasCache);
    if (!canvasIndex) {
      missingCanvas += 1;
      console.warn(`  缺 Canvas：${file.id}`);
    }

    const mobActions = Object.create(null);
    /** @type {Map<object, { origin: number[], delay: number, src: string }>} */
    const pngRef = new Map();
    const actionDirs = (imgRoot.children || []).filter(
      (c) => (c.kind === 'dir' || c.kind === 'img') && c.name && !SKIP_TOP.has(c.name),
    );

    const collectedAll = [];
    const actionMeta = Object.create(null);
    /** @type {Record<string, Record<string, number>>} */
    const crossBag = Object.create(null);
    const resolveOpts = {
      selfId: file.id,
      canvasCache,
      onCrossRef: (toId, assetPath) => noteCrossRef(crossBag, toId, assetPath),
    };

    for (const actionDir of actionDirs) {
      collectedAll.push(...collectFrames(actionDir, actionDir.name));
      const infoMeta = extractActionInfoMeta(actionDir);
      if (infoMeta) actionMeta[actionDir.name] = infoMeta;
    }
    const skillMeta = extractMobSkillMeta(imgRoot);
    if (skillMeta) {
      Object.keys(skillMeta).forEach((skillKey) => {
        actionMeta[skillKey] = { ...(actionMeta[skillKey] || {}), ...skillMeta[skillKey] };
      });
    }

    for (const { actionKey, frame, node } of collectedAll) {
      if (node.kind !== 'png') continue;
      const { buf, meta } = resolvePngBuf(node, canvasIndex, resolveOpts);
      if (!buf) {
        missingPixels += 1;
        continue;
      }
      let src = `images/idle-mobs/${file.id}/${actionKey}/${frame}.png`;
      if (!dryRun) {
        src = writeFramePng(file.id, actionKey, frame, buf);
      }
      const entry = {
        origin: meta.origin,
        delay: meta.delay || 120,
        src,
      };
      const slot = ensureSlot(mobActions, actionKey, frame);
      slot[frame] = entry;
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
            let src = `images/idle-mobs/${file.id}/${item.actionKey}/${item.frame}.png`;
            if (!dryRun) {
              src = writeFramePng(file.id, item.actionKey, item.frame, buf);
            }
            resolved = {
              origin: meta.origin,
              delay: meta.delay || 120,
              src,
            };
            pngRef.set(target, resolved);
          }
        }
        if (!resolved) {
          next.push(item);
          continue;
        }
        const slot = ensureSlot(mobActions, item.actionKey, item.frame);
        slot[item.frame] = {
          origin: resolved.origin,
          delay: resolved.delay,
          src: resolved.src,
        };
        frameCount += 1;
      }
      if (next.length === uolPending.length) break;
      uolPending = next;
    }
    if (uolPending.length) {
      console.warn(`  ${file.id}  未解 uol：${uolPending.length}`);
    }

    Object.keys(mobActions).forEach((key) => {
      if (key === '_meta') return;
      mobActions[key] = trimTrailingForeignFrames(
        file.id,
        key,
        mobActions[key].map((f) => f || null),
      );
    });
    if (Object.keys(actionMeta).length) mobActions._meta = actionMeta;

    data[file.id] = mobActions;
    const keys = Object.keys(mobActions).sort();
    console.log(`  ${file.id}  ${keys.join(', ')}`);
    for (const line of formatCrossRefWarn(file.id, crossBag)) {
      console.warn(line);
    }
    for (const toId of Object.keys(crossBag).sort()) {
      allCrossRefs.push({ selfId: file.id, toId, paths: { ...crossBag[toId] } });
      if (!canvasFileFor(toId)) {
        console.warn(`  ${file.id}  缺少被引用 Canvas：Mob._Canvas.${toId}.img.xml（特效可能缺圖）`);
      }
    }
  }

  if (allCrossRefs.length) {
    console.log('── 跨怪 _outlink 彙總 ──');
    for (const row of allCrossRefs) {
      const parts = Object.keys(row.paths).sort().map((p) => `${p}×${row.paths[p]}`);
      console.log(`  ${row.selfId} → ${row.toId}  ${parts.join(', ')}`);
    }
  }

  if (dryRun) {
    console.log(`怪物 dry-run：${files.length} 隻、約 ${frameCount} 幀`);
    return { mobs: files.length, frames: frameCount };
  }

  const js = `/** 由 scripts/import-mob-wz.mjs 從 wz-xml/mob/ 產生。不要手改。 */\n`
    + `const IDLE_MOB_DATA = ${JSON.stringify(data)};\n`
    + `if (typeof window !== 'undefined') window.IDLE_MOB_DATA = IDLE_MOB_DATA;\n`
    + `if (typeof module !== 'undefined' && module.exports) module.exports = { IDLE_MOB_DATA };\n`;
  fs.writeFileSync(OUT_DATA, js);

  console.log(`怪物：${files.length} 隻、${frameCount} 幀 → ${path.relative(ROOT, OUT_DATA)}`);
  if (missingCanvas) console.log(`缺 Canvas：${missingCanvas}`);
  if (missingPixels) console.log(`缺像素：${missingPixels}`);
  return { mobs: files.length, frames: frameCount };
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  const dryRun = process.argv.includes('--dry-run');
  importMobs({ dryRun });
}
