/**
 * 匯入 Skill.{job}.img → images/skills/{job}/ + js/skillJobData.js
 * 主檔：wz-xml/skill/Skill.{job}.img.xml
 * 像素：wz-xml/skill/Skill._Canvas.{job}.img.xml
 * 名稱：wz-xml/string/String.Skill.img.xml
 *
 *   npm run import:skill              # 自動匯入 JOB_META／資料夾內有的書（合併寫入）
 *   node scripts/import-skill-wz.mjs 111 112
 *
 * 規則：
 * - invisible=1 → 不進面板（有 summon 則匯入為 skipPanel companion）
 * - 可施放：有 mpCon／hpCon → active 或 buff（不以 damage 單獨判定）
 * - 不可施放但有用數值 → passive（即使 common 殘留 damage）
 * - hyper=1 → passive；hyper=2 → 依可施放／buffish 分流
 * - info type 40 或無有用資料 → 略過
 * - 匯出 effect／effect0／hit／mob／shootobj／ball／special／special0／state／summon 幀 + skill.fx
 * - 寫入前 merge js/skillOverrides.js（玩法調整，勿直接改 skillJobData）
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SKILL_ROOT = path.join(ROOT, 'wz-xml', 'skill');
const STRING_XML = path.join(ROOT, 'wz-xml', 'string', 'String.Skill.img.xml');
const OUT_DATA = path.join(ROOT, 'js', 'skillJobData.js');
const OUT_IMG_ROOT = path.join(ROOT, 'images', 'skills');
const require = createRequire(import.meta.url);
const SkillOverrides = require('../js/skillOverrides.js');

/**
 * 技能書 → 面板顯示名／預設 rank
 * rank：10／30／60／100／hyper／hexa
 * 112 書內另有 hyper 節點（1=被動、2=主動）→ 單技覆寫為 hyper
 * 114 = hexa，另開面板；不進一般技能線
 */
const JOB_META = {
  100: { name: '劍士', rank: '10', skillBook: 100 },
  110: { name: '狂戰士', rank: '30', skillBook: 110 },
  111: { name: '十字軍', rank: '60', skillBook: 111 },
  112: { name: '英雄', rank: '100', skillBook: 112 },
  114: { name: '英雄 Hexa', rank: 'hexa', skillBook: 114, panel: 'hexa' },
  // 法師線（冰雷）：一轉 → 二轉 → 三轉 → 四轉
  200: { name: '法師', rank: '10', skillBook: 200 },
  220: { name: '冰雷巫師', rank: '30', skillBook: 220 },
  221: { name: '冰雷魔導士', rank: '60', skillBook: 221 },
  222: { name: '大魔導士（冰、雷）', rank: '100', skillBook: 222 },
  210: { name: '火毒巫師', rank: '30', skillBook: 210 },
  211: { name: '火毒魔導士', rank: '60', skillBook: 211 },
  212: { name: '大魔導士（火、毒）', rank: '100', skillBook: 212 },
};

/** 一般技能面板職業線（不含 hexa 書）；primaryJobId = 四轉，避免分支共用 1 轉 id 衝突 */
const JOB_LINES = {
  warrior: {
    id: 'warrior',
    name: '英雄線',
    primaryJobId: 112,
    books: [100, 110, 111, 112],
  },
  mage: {
    id: 'mage',
    name: '大魔導士（冰、雷）線',
    primaryJobId: 222,
    books: [200, 220, 221, 222],
  },
  magef: {
    id: 'magef',
    name: '大魔導士（火、毒）線',
    primaryJobId: 212,
    books: [200, 210, 211, 212],
  },
};

function discoverJobIds() {
  if (!fs.existsSync(SKILL_ROOT)) return [];
  return fs.readdirSync(SKILL_ROOT)
    .map((name) => {
      const m = String(name).match(/^Skill\.(\d+)\.img\.xml$/);
      return m ? m[1] : null;
    })
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b));
}

function loadExistingBooks() {
  try {
    if (!fs.existsSync(OUT_DATA)) return {};
    const data = require(OUT_DATA);
    return (data && data.books) || {};
  } catch {
    return {};
  }
}

function parseAttrs(raw) {
  const out = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(raw || ''))) out[m[1]] = m[2];
  return out;
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
  if (!node) return null;
  return (node.children || []).find((c) => c.name === name) || null;
}

function findChildren(node, name) {
  if (!node) return [];
  return (node.children || []).filter((c) => c.name === name);
}

function intVal(node, fallback = 0) {
  if (!node) return fallback;
  const n = Number(node.value);
  return Number.isFinite(n) ? n : fallback;
}

function strVal(node, fallback = '') {
  return node?.value != null ? String(node.value) : fallback;
}

function dirToMap(dirNode) {
  const out = {};
  if (!dirNode) return out;
  (dirNode.children || []).forEach((c) => {
    if (c.kind === 'dir') return;
    out[c.name] = c.value;
  });
  return out;
}

/** psdWeaponBooster.actionSpeed 等被動攻速（極速詠唱等），合併進 common 供公式讀取 */
function enrichCommonFromPsd(skillNode, common) {
  const out = common && typeof common === 'object' ? { ...common } : {};
  const psdNode = findChild(skillNode, 'psdWeaponBooster');
  if (!psdNode) return out;
  const psd = dirToMap(psdNode);
  if ((out.actionSpeed == null || String(out.actionSpeed) === '')
    && psd.actionSpeed != null && String(psd.actionSpeed) !== '') {
    out.actionSpeed = psd.actionSpeed;
  }
  return out;
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

function outlinkKey(outlink) {
  const s = String(outlink || '');
  const i = s.indexOf('.img/');
  return i >= 0 ? s.slice(i + 5) : s.replace(/^.*?\.img\//, '');
}

/** @type {Map<string, Record<string, object>>} */
const canvasIndexCache = new Map();

function loadCanvasIndex(canvasJobId) {
  const id = String(canvasJobId || '');
  if (!id) return Object.create(null);
  if (canvasIndexCache.has(id)) return canvasIndexCache.get(id);
  const canvasPath = path.join(SKILL_ROOT, `Skill._Canvas.${id}.img.xml`);
  if (!fs.existsSync(canvasPath)) {
    const empty = Object.create(null);
    canvasIndexCache.set(id, empty);
    return empty;
  }
  const index = pngIndexFromTree(parseWzXml(fs.readFileSync(canvasPath, 'utf8')));
  canvasIndexCache.set(id, index);
  return index;
}

/** Skill/_Canvas/222.img/skill/… → "222" */
function outlinkCanvasJobId(outlink) {
  const m = String(outlink || '').match(/\/_Canvas\/(\d+)\.img\//i);
  return m ? m[1] : null;
}

function resolvePngBuf(pngNode, canvasIndex) {
  if (!pngNode) return null;
  let buf = decodePng(pngNode.value);
  const outlink = findChild(pngNode, '_outlink');
  // 主檔常放 1×1 佔位圖；有 _outlink 且本檔像素太小 → 改讀 Canvas
  const tiny = !buf || buf.length < 200;
  if (!tiny) return buf;
  if (!outlink?.value) return buf;
  const key = outlinkKey(outlink.value);
  const canvasJobId = outlinkCanvasJobId(outlink.value);
  const index = canvasJobId ? loadCanvasIndex(canvasJobId) : (canvasIndex || Object.create(null));
  const linked = index[key];
  if (!linked) {
    const label = canvasJobId ? `${canvasJobId}.img/${key}` : key;
    console.warn(`  missing canvas for outlink: ${label}`);
    return buf;
  }
  const fromCanvas = decodePng(linked.value);
  return fromCanvas || buf;
}

function loadStringMap() {
  if (!fs.existsSync(STRING_XML)) {
    console.warn('缺少 String.Skill.img.xml，技能名稱將用 id');
    return Object.create(null);
  }
  const root = parseWzXml(fs.readFileSync(STRING_XML, 'utf8'));
  const map = Object.create(null);
  (root.children || []).forEach((dir) => {
    if (dir.kind !== 'dir' || !/^\d+$/.test(dir.name)) return;
    map[dir.name] = {
      name: strVal(findChild(dir, 'name'), dir.name),
      desc: strVal(findChild(dir, 'desc'), ''),
      h: strVal(findChild(dir, 'h'), ''),
    };
  });
  return map;
}

const USEFUL_COMMON_KEYS = new Set([
  'strX', 'dexX', 'intX', 'lukX',
  'padX', 'madX', 'pddX', 'mddX',
  'damR', 'bdR', 'cr', 'criticaldamage',
  'asrR', 'terR', 'mastery', 'prop', 'subProp',
  'mhpR', 'mmpR', 'psdSpeed', 'psdJump', 'stanceProp',
  'psd', 'ignoreMobpdpR', 'nbdR', 'hcHp',
]);

function commonNonEmpty(common, key) {
  if (!common || common[key] == null) return false;
  const s = String(common[key]).trim();
  return s !== '' && s !== '0';
}

function hasMpCon(common) {
  return commonNonEmpty(common, 'mpCon') || commonNonEmpty(common, 'hpCon');
}

function hasUsefulCommon(common) {
  if (!common || typeof common !== 'object') return false;
  for (const key of Object.keys(common)) {
    if (key === 'maxLevel') continue;
    if (key.startsWith('indie')) return true;
    if (USEFUL_COMMON_KEYS.has(key) && commonNonEmpty(common, key)) return true;
  }
  // 強化恢復：週期 u + 恢復量 x/y
  if (commonNonEmpty(common, 'u')
    && (commonNonEmpty(common, 'x') || commonNonEmpty(common, 'y'))) {
    return true;
  }
  return false;
}

function hasIndieBuffStats(common) {
  if (!common) return false;
  return Object.keys(common).some((k) => k.startsWith('indie') && commonNonEmpty(common, k));
}

function isBuffish(common, skillNode) {
  if (!commonNonEmpty(common, 'time')) return false;
  if (hasIndieBuffStats(common)) return true;
  if (findChild(skillNode, 'summon')) return true;
  // 有持續時間、無傷害段數 → 純增益／姿態
  const hasDamage = commonNonEmpty(common, 'damage');
  const hasAttackCount = commonNonEmpty(common, 'attackCount');
  if (!hasDamage && !hasAttackCount) return true;
  // 有 time + damage 但同時有明確增益鍵 → 仍視為 Buff（如劍士意念）
  if (hasIndieBuffStats(common)) return true;
  return false;
}

function hasAttackAction(skillNode, common) {
  const actions = extractActions(skillNode);
  if (!actions.length) return false;
  return commonNonEmpty(common, 'damage') || commonNonEmpty(common, 'attackCount');
}

function classifyResult(base) {
  const type = base.type;
  const equipable = type === 'active' || type === 'buff';
  return { skip: false, equipable, ...base };
}

function classifySkill(skillNode, common) {
  const invisible = intVal(findChild(skillNode, 'invisible'), 0) === 1;
  const hasSummon = !!findChild(skillNode, 'summon');
  const info = findChild(skillNode, 'info');
  const infoType = intVal(findChild(info, 'type'), 0);
  const hyper = intVal(findChild(skillNode, 'hyper'), 0);
  const hasDamage = commonNonEmpty(common, 'damage');
  const hasAttackCount = commonNonEmpty(common, 'attackCount');
  const castable = hasMpCon(common);

  // invisible + summon → 隱藏 companion（如 1121055）
  if (invisible && hasSummon) {
    return classifyResult({
      type: 'summon',
      skipPanel: true,
      infoType,
      ...(hyper ? { hyper, rank: 'hyper' } : {}),
    });
  }

  // invisible + 有傷害／動作 → 隱藏攻擊形態（如狂暴攻擊滿鬥氣 1120017）
  if (invisible && (hasDamage || hasAttackCount) && hasAttackAction(skillNode, common)) {
    return classifyResult({
      type: 'active',
      skipPanel: true,
      equipable: false,
      infoType,
      ...(hyper ? { hyper, rank: 'hyper' } : {}),
    });
  }

  if (invisible) return { skip: true, reason: 'invisible' };

  // 純位移施放技（戰鬥置換）：type 40 + mpCon、無傷害
  // 注意：部分被動也會標 type 40（如姿態），有用數值則不可略過
  if (infoType === 40 && castable && !hasDamage && !hasAttackCount) {
    return { skip: true, reason: 'mobility' };
  }

  // hyper=1 永遠被動
  if (hyper === 1) {
    return classifyResult({
      type: 'passive',
      infoType,
      rank: 'hyper',
      hyper,
    });
  }

  // hyper=2：可施放 → buff／active；否則被動（隱形觸發等）
  if (hyper === 2) {
    const hyperCastable = castable || hasAttackAction(skillNode, common);
    if (!hyperCastable) {
      return classifyResult({
        type: 'passive',
        infoType,
        rank: 'hyper',
        hyper,
      });
    }
    if (isBuffish(common, skillNode)) {
      return classifyResult({
        type: 'buff',
        infoType,
        rank: 'hyper',
        hyper,
      });
    }
    if (hasDamage || hasAttackCount) {
      return classifyResult({
        type: 'active',
        infoType,
        rank: 'hyper',
        hyper,
      });
    }
    return classifyResult({
      type: 'buff',
      infoType,
      rank: 'hyper',
      hyper,
    });
  }

  // 有 mpCon／hpCon → 玩家可施放
  if (castable) {
    if (isBuffish(common, skillNode)) {
      return classifyResult({ type: 'buff', infoType });
    }
    if (hasDamage || hasAttackCount) {
      return classifyResult({ type: 'active', infoType });
    }
    return classifyResult({ type: 'buff', infoType });
  }

  // 不可施放：有用數值 → 被動（含有 damage 殘留的伺機／終極攻擊）
  if (hasUsefulCommon(common) || hasDamage || hasAttackCount
    || intVal(findChild(skillNode, 'psd'), 0) === 1) {
    return classifyResult({ type: 'passive', infoType });
  }

  // 純位移或其他無資料
  if (infoType === 40) return { skip: true, reason: 'mobility' };
  return { skip: true, reason: 'no_useful_data' };
}

function extractActions(skillNode) {
  const actionDir = findChild(skillNode, 'action');
  if (!actionDir) return [];
  return (actionDir.children || [])
    .filter((c) => c.kind === 'string')
    .sort((a, b) => Number(a.name) - Number(b.name))
    .map((c) => String(c.value || ''))
    .filter(Boolean);
}

function parseOrigin(value) {
  if (value == null || value === '') return [0, 0];
  const parts = String(value).split(',').map((s) => Number(String(s).trim()));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
  ];
}

/** 匯出數字幀 png 序列（effect／effect0／hit/0） */
function extractFrameSequence(dirNode, canvasIndex, outDir, relBase) {
  if (!dirNode) return [];
  const pngs = (dirNode.children || [])
    .filter((c) => c.kind === 'png' && /^\d+$/.test(c.name))
    .sort((a, b) => Number(a.name) - Number(b.name));
  if (!pngs.length) return [];
  fs.mkdirSync(outDir, { recursive: true });
  const frames = [];
  pngs.forEach((png) => {
    const buf = resolvePngBuf(png, canvasIndex);
    const origin = parseOrigin(findChild(png, 'origin')?.value);
    const delayRaw = findChild(png, 'delay')?.value;
    const delayN = Number(delayRaw);
    const delay = Number.isFinite(delayN) && delayN > 0 ? delayN : 90;
    let src = '';
    if (buf) {
      const fileName = `${png.name}.png`;
      fs.writeFileSync(path.join(outDir, fileName), buf);
      src = `${relBase}/${fileName}`;
    }
    frames.push({
      src,
      delay,
      origin,
    });
  });
  return frames;
}

function parseVectorPair(value) {
  const parts = String(value || '').split(',').map((s) => Number(String(s).trim()));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
  ];
}

/** 單張 png（state／number icon）→ frame */
function extractSinglePng(pngNode, canvasIndex, outPath, relSrc) {
  if (!pngNode || pngNode.kind !== 'png') return null;
  const buf = resolvePngBuf(pngNode, canvasIndex);
  if (!buf) return null;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  return {
    src: relSrc,
    delay: (() => {
      const n = Number(findChild(pngNode, 'delay')?.value);
      return Number.isFinite(n) && n > 0 ? n : 120;
    })(),
    origin: parseOrigin(findChild(pngNode, 'origin')?.value),
  };
}

function extractFx(skillNode, skillId, jobId, canvasIndex) {
  const fx = {};
  const baseDir = path.join(OUT_IMG_ROOT, String(jobId), String(skillId));
  const relRoot = `images/skills/${jobId}/${skillId}`;

  const effectDir = findChild(skillNode, 'effect');
  if (effectDir) {
    const frames = extractFrameSequence(
      effectDir,
      canvasIndex,
      path.join(baseDir, 'effect'),
      `${relRoot}/effect`,
    );
    if (frames.length) fx.effect = frames;
  }

  const effect0Dir = findChild(skillNode, 'effect0');
  if (effect0Dir) {
    const frames = extractFrameSequence(
      effect0Dir,
      canvasIndex,
      path.join(baseDir, 'effect0'),
      `${relRoot}/effect0`,
    );
    if (frames.length) fx.effect0 = frames;
  }

  const hitDir = findChild(skillNode, 'hit');
  if (hitDir) {
    const hit0 = findChild(hitDir, '0');
    const seqDir = hit0 && hit0.kind === 'dir' ? hit0 : hitDir;
    const frames = extractFrameSequence(
      seqDir,
      canvasIndex,
      path.join(baseDir, 'hit'),
      `${relRoot}/hit`,
    );
    if (frames.length) fx.hit = frames;
  }

  // 狀態 Debuff：掛在怪物身上循環播放（傷痕之劍 mob／烈焰翔斬 mob/0 等）
  const mobDir = findChild(skillNode, 'mob');
  if (mobDir) {
    const mob0 = findChild(mobDir, '0');
    const seqDir = mob0 && mob0.kind === 'dir' ? mob0 : mobDir;
    const frames = extractFrameSequence(
      seqDir,
      canvasIndex,
      path.join(baseDir, 'mob'),
      `${relRoot}/mob`,
    );
    if (frames.length) {
      const repeat = intVal(findChild(mobDir, 'repeat'), 0)
        || intVal(findChild(seqDir, 'repeat'), 0);
      const pos = intVal(findChild(mobDir, 'pos'), 0)
        || intVal(findChild(seqDir, 'pos'), 0);
      fx.mob = {
        frames,
        repeat,
        pos,
      };
    }
  }

  // 投擲物：effect 在自身；shootobj 飛出；hit 在目標
  const shootDir = findChild(skillNode, 'shootobj');
  if (shootDir) {
    const info = dirToMap(findChild(shootDir, 'info'));
    const layers = [];
    const layerList = findChild(shootDir, 'layerList');
    (layerList?.children || []).forEach((layer) => {
      if (layer.kind !== 'dir') return;
      const frames = extractFrameSequence(
        layer,
        canvasIndex,
        path.join(baseDir, 'shootobj', layer.name),
        `${relRoot}/shootobj/${layer.name}`,
      );
      if (frames.length) layers.push({ name: layer.name, frames });
    });
    // moveList：p1～p5 各方向的 v／pos／delay
    const moveList = {};
    const moveDir = findChild(shootDir, 'moveList');
    (moveDir?.children || []).forEach((pNode) => {
      if (pNode.kind !== 'dir') return;
      const steps = [];
      (pNode.children || []).forEach((stepNode) => {
        if (stepNode.kind !== 'dir') return;
        const m = dirToMap(stepNode);
        steps.push({
          v: Number(m.v) || 0,
          delay: Number(m.delay) || 0,
          pos: parseVectorPair(m.pos),
        });
      });
      if (steps.length) moveList[pNode.name] = steps;
    });
    if (layers.length) {
      const startDelayRaw = Number(info.startDelay);
      fx.shootobj = {
        layers,
        start: parseVectorPair(info.start),
        bodyWH: parseVectorPair(info.bodyWH),
        startDelayMs: Number.isFinite(startDelayRaw) && startDelayRaw > 0 ? startDelayRaw : 0,
        pierce: Number(info.useUpWhenMaxMobCount) === 1
          || Number(info.pierce) === 1
          || Number(info.penetrate) === 1,
        noHitWhenMaxCount: Number(info.noHitWhenMaxCount) === 1,
        ...(Object.keys(moveList).length ? { moveList } : {}),
      };
    }
  }

  // 法師彈道：ball 可為平面幀序列，或 0／1／front 等子層
  const ballDir = findChild(skillNode, 'ball');
  if (ballDir) {
    const flat = extractFrameSequence(
      ballDir,
      canvasIndex,
      path.join(baseDir, 'ball'),
      `${relRoot}/ball`,
    );
    const layers = [];
    (ballDir.children || []).forEach((child) => {
      if (child.kind !== 'dir') return;
      const frames = extractFrameSequence(
        child,
        canvasIndex,
        path.join(baseDir, 'ball', child.name),
        `${relRoot}/ball/${child.name}`,
      );
      if (frames.length) layers.push({ name: child.name, frames });
    });
    layers.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
    if (flat.length || layers.length) {
      fx.ball = {
        ...(flat.length ? { frames: flat } : {}),
        ...(layers.length ? { layers } : {}),
      };
    }
  }

  // 鬥氣等：special 循環球特效；state/N 對應層數外觀
  const specialDir = findChild(skillNode, 'special');
  if (specialDir) {
    const frames = extractFrameSequence(
      specialDir,
      canvasIndex,
      path.join(baseDir, 'special'),
      `${relRoot}/special`,
    );
    if (frames.length) {
      const relMove = findChild(specialDir, 'relMove');
      const repeat = intVal(findChild(specialDir, 'repeat'), 0);
      fx.special = {
        frames,
        repeat,
        relMove: parseVectorPair(relMove?.value),
      };
    }
  }

  // 冰川之牆等：special0 與 special 同時播
  const special0Dir = findChild(skillNode, 'special0');
  if (special0Dir) {
    const frames = extractFrameSequence(
      special0Dir,
      canvasIndex,
      path.join(baseDir, 'special0'),
      `${relRoot}/special0`,
    );
    if (frames.length) fx.special0 = frames;
  }

  const stateDir = findChild(skillNode, 'state');
  if (stateDir) {
    const states = {};
    (stateDir.children || []).forEach((child) => {
      if (child.kind === 'png' && /^\d+$/.test(child.name)) {
        const frame = extractSinglePng(
          child,
          canvasIndex,
          path.join(baseDir, 'state', `${child.name}.png`),
          `${relRoot}/state/${child.name}.png`,
        );
        if (frame) states[child.name] = [frame];
      } else if (child.kind === 'dir' && /^\d+$/.test(child.name)) {
        const frames = extractFrameSequence(
          child,
          canvasIndex,
          path.join(baseDir, 'state', child.name),
          `${relRoot}/state/${child.name}`,
        );
        if (frames.length) states[child.name] = frames;
      } else if (child.kind === 'dir' && child.name === 'start') {
        const frames = extractFrameSequence(
          child,
          canvasIndex,
          path.join(baseDir, 'state', 'start'),
          `${relRoot}/state/start`,
        );
        if (frames.length) fx.stateStart = frames;
      }
    });
    if (Object.keys(states).length) fx.state = states;
  }

  const summonDir = findChild(skillNode, 'summon');
  if (summonDir) {
    const summonAttacks = [];
    const summonVisual = {};
    (summonDir.children || []).forEach((child) => {
      if (child.kind !== 'dir') return;
      const frames = extractFrameSequence(
        child,
        canvasIndex,
        path.join(baseDir, 'summon', child.name),
        `${relRoot}/summon/${child.name}`,
      );
      if (!frames.length) return;
      if (/^attack\d+$/i.test(child.name)) {
        const info = findChild(child, 'info');
        const infoMap = dirToMap(info);
        summonAttacks.push({
          name: child.name,
          frames,
          ...(infoMap.mobCount != null ? { mobCount: infoMap.mobCount } : {}),
          ...(infoMap.attackCount != null ? { attackCount: infoMap.attackCount } : {}),
        });
        return;
      }
      // summoned／stand／move／die／hit 等視覺態
      if (/^(summoned|stand|move|die|hit)$/i.test(child.name)) {
        summonVisual[child.name.toLowerCase()] = frames;
      }
    });
    summonAttacks.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
    if (summonAttacks.length) fx.summonAttacks = summonAttacks;
    if (Object.keys(summonVisual).length) fx.summonVisual = summonVisual;
  }

  // 長壓／引導技：prepare → keydown (+ keydown0) → keydownend
  ['prepare', 'keydown', 'keydown0', 'keydownend'].forEach((layerName) => {
    const layerDir = findChild(skillNode, layerName);
    if (!layerDir) return;
    const frames = extractFrameSequence(
      layerDir,
      canvasIndex,
      path.join(baseDir, layerName),
      `${relRoot}/${layerName}`,
    );
    if (frames.length) fx[layerName] = frames;
    const metaTime = intVal(findChild(layerDir, 'time'), 0);
    if (metaTime > 0) fx[`${layerName}Meta`] = { timeMs: metaTime };
  });

  // 暴風雪 tile1~8（WZ 目錄 0~7）
  const tileDir = findChild(skillNode, 'tile');
  if (tileDir) {
    const tiles = [];
    (tileDir.children || []).forEach((child) => {
      if (child.kind !== 'dir' || !/^\d+$/.test(child.name)) return;
      const frames = extractFrameSequence(
        child,
        canvasIndex,
        path.join(baseDir, 'tile', child.name),
        `${relRoot}/tile/${child.name}`,
      );
      if (frames.length) tiles.push({ id: Number(child.name), frames });
    });
    tiles.sort((a, b) => a.id - b.id);
    if (tiles.length) fx.tiles = tiles;
  }

  return Object.keys(fx).length ? fx : null;
}

/** effect 前 N 幀 delay 累加 → ball 發射時機 */
function frameDelaySumUntil(frames, untilIdx) {
  let sum = 0;
  const list = frames || [];
  for (let i = 0; i < untilIdx && i < list.length; i += 1) {
    sum += Math.max(1, Number(list[i]?.delay) || 60);
  }
  return sum;
}

function deriveBallCast(skillNode, fx, common) {
  if (!fx?.ball) return null;
  const info = findChild(skillNode, 'info');
  const infoType = intVal(findChild(info, 'type'), 0);
  if (infoType !== 2) return null;

  const chainAttack = intVal(findChild(info, 'chainAttack'), 0) === 1;
  const areaAttack = intVal(findChild(info, 'areaAttack'), 0) === 1;
  const layers = fx.ball.layers || [];
  const hasBeam = layers.some((l) => l.name === 'front') && layers.some((l) => l.name === 'rear');
  const timeRaw = Number(common?.time);
  const hasOrbDuration = Number.isFinite(timeRaw) && timeRaw >= 100;
  // 冰鋒刃：飛出固定距離後停住循環 ball，持續傷害
  if (areaAttack && hasOrbDuration && !hasBeam) {
    const launchFrame = 8;
    let launchMs = frameDelaySumUntil(fx.effect, launchFrame);
    const xRaw = Number(common?.x);
    return {
      launchFrame,
      launchMs,
      ballMode: 'orb',
      travel: 'horizontal',
      travelDistancePx: Math.max(120, Math.min(420, Math.round((Number.isFinite(xRaw) ? xRaw : 600) / 5))),
      durationMs: Math.round(timeRaw),
      tickMs: (() => {
        const st = Number(common?.subTime);
        if (!(st > 0)) return 240;
        if (st >= 100) return Math.round(st);
        if (st <= 30) return Math.round(st * 60);
        return Math.round(st);
      })(),
      aoeRadius: Math.max(80, Math.min(200, Math.round((Number.isFinite(xRaw) ? xRaw : 600) / 12))),
      specialOnFirstHit: false,
      aoeOnSpecial: false,
      chain: false,
      speedPxPerMs: 0.55,
    };
  }

  const ballMode = hasBeam ? 'beam' : 'sprite';
  const rangeRaw = Number(common?.range);
  const yRaw = Number(common?.y);
  if (chainAttack && ballMode === 'beam') {
    const launchFrame = 8;
    let launchMs = frameDelaySumUntil(fx.effect, launchFrame);
    const ballDelayRaw = Number(common?.ballDelay);
    if (Number.isFinite(ballDelayRaw) && ballDelayRaw > 0) launchMs = ballDelayRaw;
    return {
      launchFrame,
      launchMs,
      ballMode,
      travel: 'horizontal',
      specialOnFirstHit: false,
      aoeOnSpecial: false,
      aoeRadius: Math.max(40, Number(common?.x) || 100),
      chain: false,
      instantBeam: true,
      instantTargets: 8,
      instantBeamLengthScale: 2,
      speedPxPerMs: 18 / 30,
    };
  }
  const chain = chainAttack || ballMode === 'beam';
  const chainRangePx = chain
    ? Math.min(560, Math.max(360, Math.round(Math.max(rangeRaw || 420, yRaw || 350) * 1.15)))
    : 0;
  const launchFrame = 8;
  let launchMs = frameDelaySumUntil(fx.effect, launchFrame);
  const ballDelayRaw = Number(common?.ballDelay);
  if (Number.isFinite(ballDelayRaw) && ballDelayRaw > 0) launchMs = ballDelayRaw;

  return {
    launchFrame,
    launchMs,
    ballMode,
    travel: 'horizontal',
    specialOnFirstHit: !!(fx.special?.frames?.length),
    aoeOnSpecial: !!(fx.special?.frames?.length) && !chainAttack,
    aoeRadius: Math.max(40, Number(common?.x) || 100),
    chain,
    chainRangePx,
    chainFirstRangePx: chain ? Math.min(640, Math.round(chainRangePx * 1.4)) : 0,
    speedPxPerMs: 18 / 30,
  };
}

/** 區域施放（冰川之牆）：effect+effect0+special+special0 同時播，第 N 幀結算 */
function deriveAreaCast(skillNode, fx) {
  if (!fx) return null;
  const info = findChild(skillNode, 'info');
  const areaAttack = intVal(findChild(info, 'areaAttack'), 0) === 1;
  const hasSpecial0 = Array.isArray(fx.special0) && fx.special0.length > 0;
  const hasSpecial = !!(fx.special?.frames?.length);
  const hasEffect = Array.isArray(fx.effect) && fx.effect.length > 0;
  // 冰川之牆型：四層齊備，或 areaAttack + special 系
  if (!(hasSpecial0 && hasSpecial && hasEffect) && !(areaAttack && hasSpecial && hasEffect)) {
    return null;
  }
  // 有 ball 的走 ballCast，不搶
  if (fx.ball) return null;

  const hitFrame = 8;
  let hitMs = frameDelaySumUntil(fx.effect, hitFrame);
  if (!(hitMs > 0)) hitMs = hitFrame * 60;

  return {
    hitFrame,
    hitMs,
    layers: ['effect', 'effect0', 'special', 'special0'],
  };
}

/** 長壓引導（冰龍吐息／雷霆萬鈞）：prepare → keydown + 側向 FX → keydownend */
function deriveChannelCast(skillNode, fx, skillId) {
  if (!fx?.prepare?.length || !fx?.keydown?.length) return null;
  const prepareDir = findChild(skillNode, 'prepare');
  const keydownDir = findChild(skillNode, 'keydown');
  let prepareMs = intVal(findChild(prepareDir, 'time'), 0);
  if (!(prepareMs > 0)) prepareMs = frameDelaySumUntil(fx.prepare, fx.prepare.length);
  let keydownLoopMs = intVal(findChild(keydownDir, 'time'), 0);
  if (!(keydownLoopMs > 0)) keydownLoopMs = frameDelaySumUntil(fx.keydown, fx.keydown.length);
  const sideFx = fx.keydown0?.length
    ? 'keydown0'
    : (fx.special?.frames?.length ? 'special' : null);
  const tickMs = skillId === '2221011' ? 500 : (skillId === '2221052' ? 100 : undefined);
  return {
    prepareMs,
    keydownLoopMs,
    channelSecKey: 'q',
    tickMsKey: 's',
    ...(tickMs ? { tickMs } : {}),
    sideFx,
    sideOffset: [150, -50],
  };
}

/** 暴風雪：effect+effect0 同時，第 15 幀 tile、第 18 幀傷害 */
function deriveBlizzardCast(skillNode, fx) {
  if (!fx?.effect?.length || !fx?.effect0?.length || !fx?.tiles?.length) return null;
  const tileFrame = 15;
  const hitFrame = 18;
  const timingFx = fx.effect0?.length ? fx.effect0 : fx.effect;
  let tileMs = frameDelaySumUntil(timingFx, tileFrame);
  let hitMs = frameDelaySumUntil(timingFx, hitFrame);
  if (!(tileMs > 0)) tileMs = tileFrame * 60;
  if (!(hitMs > 0)) hitMs = hitFrame * 60;
  return {
    tileFrame,
    hitFrame,
    tileMs,
    hitMs,
    maxTileTargets: 15,
  };
}

function linkSummonCompanions(skills) {
  const byId = Object.create(null);
  skills.forEach((s) => { byId[String(s.id)] = s; });

  // 已知：劍士意念 1121054 → 1121055
  if (byId['1121054'] && byId['1121055']) {
    byId['1121054'].summonSkillId = '1121055';
  }
  // 狂暴攻擊滿鬥氣形態 1121008 → 1120017
  if (byId['1121008'] && byId['1120017']) {
    byId['1121008'].enhancedSkillId = '1120017';
  }

  // 通用：同書 damage 對得上的 invisible summon 掛到有 time+indiePad／damage 的父技
  const summons = skills.filter((s) => s.type === 'summon' || s.skipPanel);
  const parents = skills.filter((s) => !s.skipPanel && s.common?.damage != null);
  summons.forEach((sum) => {
    if (parents.some((p) => p.summonSkillId === String(sum.id))) return;
    const dmg = String(sum.common?.damage ?? '');
    if (!dmg) return;
    const parent = parents.find((p) => !p.summonSkillId && String(p.common?.damage ?? '') === dmg
      && (p.common?.indiePad != null || p.common?.time != null));
    if (parent) parent.summonSkillId = String(sum.id);
  });
}

function importJobBook(jobId, stringMap) {
  const mainPath = path.join(SKILL_ROOT, `Skill.${jobId}.img.xml`);
  const canvasPath = path.join(SKILL_ROOT, `Skill._Canvas.${jobId}.img.xml`);
  if (!fs.existsSync(mainPath)) {
    console.warn(`缺少 ${mainPath}`);
    return null;
  }
  const mainRoot = parseWzXml(fs.readFileSync(mainPath, 'utf8'));
  const skillRoot = findChild(mainRoot, 'skill') || mainRoot;
  const canvasIndex = loadCanvasIndex(jobId);

  const outImgDir = path.join(OUT_IMG_ROOT, String(jobId));
  fs.mkdirSync(outImgDir, { recursive: true });

  const meta = JOB_META[jobId] || {
    name: `Job${jobId}`,
    rank: '10',
    skillBook: Number(jobId),
  };

  const skills = [];
  let importedIcons = 0;
  let importedFxFrames = 0;
  let skipped = 0;

  (skillRoot.children || []).forEach((skillNode) => {
    if (skillNode.kind !== 'dir' || !/^\d+$/.test(skillNode.name)) return;
    const skillId = skillNode.name;
    const common = enrichCommonFromPsd(skillNode, dirToMap(findChild(skillNode, 'common')));
    const cls = classifySkill(skillNode, common);
    if (cls.skip) {
      skipped += 1;
      console.log(`  skip ${skillId} (${cls.reason})`);
      return;
    }

    const maxLevel = Number(common.maxLevel) || 1;
    const strings = stringMap[skillId] || { name: skillId, desc: '', h: '' };

    const iconNode = findChild(skillNode, 'icon');
    const iconBuf = resolvePngBuf(iconNode, canvasIndex);
    let iconPath = '';
    if (iconBuf) {
      const fileName = `${skillId}.png`;
      fs.writeFileSync(path.join(outImgDir, fileName), iconBuf);
      iconPath = `images/skills/${jobId}/${fileName}`;
      importedIcons += 1;
    }

    const fx = extractFx(skillNode, skillId, jobId, canvasIndex);
    const infoNode = findChild(skillNode, 'info');
    const chainAttack = intVal(findChild(infoNode, 'chainAttack'), 0) === 1;
    const areaAttack = intVal(findChild(infoNode, 'areaAttack'), 0) === 1;
    const ballCast = fx ? deriveBallCast(skillNode, fx, common) : null;
    const areaCast = fx ? deriveAreaCast(skillNode, fx) : null;
    const channelCast = fx ? deriveChannelCast(skillNode, fx, skillId) : null;
    const blizzardCast = fx ? deriveBlizzardCast(skillNode, fx) : null;
    if (fx) {
      Object.values(fx).forEach((val) => {
        if (Array.isArray(val) && val[0]?.src != null) {
          importedFxFrames += val.filter((f) => f?.src).length;
        } else if (Array.isArray(val) && val[0]?.frames) {
          val.forEach((a) => {
            importedFxFrames += (a.frames || []).filter((f) => f?.src).length;
          });
        }
      });
    }

    const reqLev = intVal(findChild(skillNode, 'reqLev'), 0)
      || intVal(findChild(infoNode, 'reqLev'), 0);

    skills.push({
      id: skillId,
      name: strings.name,
      desc: strings.desc,
      h: strings.h,
      rank: cls.rank || meta.rank,
      type: cls.type,
      equipable: !!cls.equipable,
      maxLevel,
      infoType: cls.infoType,
      ...(reqLev > 0 ? { reqLevel: reqLev } : {}),
      ...(chainAttack ? { chainAttack: true } : {}),
      ...(areaAttack ? { areaAttack: true } : {}),
      ...(Number(cls.infoType) === 1 && !areaAttack && !channelCast ? { projectile: true } : {}),
      actions: extractActions(skillNode),
      common,
      icon: iconPath,
      skillBook: Number(jobId),
      ...(cls.skipPanel ? { skipPanel: true } : {}),
      ...(cls.hyper ? { hyper: cls.hyper } : {}),
      ...(ballCast ? { ballCast } : {}),
      ...(areaCast ? { areaCast } : {}),
      ...(channelCast ? { channelCast } : {}),
      ...(blizzardCast ? { blizzardCast } : {}),
      ...(fx ? { fx } : {}),
    });
  });

  skills.sort((a, b) => Number(a.id) - Number(b.id));
  linkSummonCompanions(skills);
  for (let i = 0; i < skills.length; i += 1) {
    skills[i] = SkillOverrides.apply(skills[i]);
  }

  console.log(`job ${jobId} (${meta.name}): ${skills.length} skills, ${importedIcons} icons, ${importedFxFrames} fx frames, ${skipped} skipped`);
  return {
    jobId: Number(jobId),
    name: meta.name,
    rank: meta.rank,
    skillBook: meta.skillBook,
    ...(meta.panel ? { panel: meta.panel } : {}),
    skills,
  };
}

function main() {
  const args = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
  const discovered = discoverJobIds();
  const jobIds = args.length
    ? args
    : (discovered.length ? discovered : Object.keys(JOB_META));
  const stringMap = loadStringMap();
  const books = { ...loadExistingBooks() };

  console.log(`匯入技能書: ${jobIds.join(', ') || '(無)'}`);
  jobIds.forEach((id) => {
    const book = importJobBook(id, stringMap);
    if (book) books[id] = book;
  });

  const lines = {};
  Object.entries(JOB_LINES).forEach(([key, line]) => {
    const present = (line.books || [])
      .map((b) => String(b))
      .filter((b) => books[b]);
    if (!present.length) return;
    const primary = present.includes(String(line.primaryJobId))
      ? Number(line.primaryJobId)
      : Number(present[0]);
    lines[key] = {
      id: line.id || key,
      name: line.name,
      primaryJobId: primary,
      books: present.map(Number),
    };
  });

  const js = `/** 由 scripts/import-skill-wz.mjs 產生，請勿手改。 */
const SkillJobData = ${JSON.stringify({ books, lines }, null, 2)};

if (typeof window !== 'undefined') {
  window.SkillJobData = SkillJobData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillJobData;
}
`;
  fs.writeFileSync(OUT_DATA, js, 'utf8');
  console.log(`wrote ${path.relative(ROOT, OUT_DATA)}`);
  Object.values(lines).forEach((line) => {
    console.log(`line ${line.id}: books [${line.books.join(', ')}] primary=${line.primaryJobId}`);
  });
}

main();
