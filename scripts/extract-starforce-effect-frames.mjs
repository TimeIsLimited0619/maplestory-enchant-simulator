/**
 * 從 UI.Enchant.img.xml 提取星力強化動畫（try / success / fail）
 * 用法: node scripts/extract-starforce-effect-frames.mjs [xmlPath] [tier]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const DEFAULT_TIER = process.argv[3] || '1';
const OUT_JS = path.join(ROOT, 'js', 'starforceEffectData.js');
const OUT_JSON = path.join(ROOT, 'data', 'starforce-enchant-summary.json');

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractEffectStarForceBlock(xml) {
  const hit = xml.indexOf('effect/starForce/0/try/itemIcon/front/0');
  if (hit === -1) throw new Error('missing effect/starForce block');
  const start = xml.lastIndexOf('<dir name="starForce">', hit);
  const end = xml.indexOf('<dir name="traceTransfer">', hit);
  if (start === -1 || end === -1) throw new Error('cannot slice effect/starForce block');
  return xml.slice(start, end);
}

function extractStarForceLayoutBlock(xml) {
  const hit = xml.indexOf('Enchant.img/starForce/layer:summaryBox');
  if (hit === -1) throw new Error('missing Enchant.img/starForce layout block');
  const start = xml.lastIndexOf('<dir name="starForce">', hit);
  const end = xml.indexOf('\n  <dir name="scroll">', start);
  if (start === -1 || end === -1) throw new Error('cannot slice starForce layout block');
  return xml.slice(start, end);
}

function parsePngFrames(html) {
  const frames = [];
  const pngRe = /<png name="(\d+)"[^>]*>([\s\S]*?)<\/png>/g;
  let m;
  while ((m = pngRe.exec(html)) !== null) {
    const inner = m[2];
    const originM = inner.match(/<vector name="origin" value="([^"]+)"/);
    const delayM = inner.match(/<int32 name="delay" value="(\d+)"/);
    const linkM = inner.match(/<string name="_outlink" value="([^"]+)"/);
    frames.push({
      i: parseInt(m[1], 10),
      o: originM ? parseVector(originM[1]) : null,
      d: delayM ? parseInt(delayM[1], 10) : 60,
      hasImg: Boolean(linkM),
      outlink: linkM ? linkM[1] : null,
    });
  }
  frames.sort((a, b) => a.i - b.i);
  return frames;
}

function parseItemIconLayers(html) {
  const result = { anchor: { x: 209, y: 114 }, layers: {} };
  const anchorM = html.match(/<dir name="itemIcon">[\s\S]*?<vector name="origin" value="([^"]+)"/);
  if (anchorM) result.anchor = parseVector(anchorM[1]);

  for (const layer of ['back', 'front']) {
    const layerMatch = html.match(new RegExp(`<dir name="${layer}">([\\s\\S]*?)<\\/dir>\\s*(?:<dir name="|$)`));
    if (!layerMatch) continue;
    const frames = parsePngFrames(layerMatch[1]);
    if (frames.length) result.layers[`itemIcon/${layer}`] = frames;
  }
  return result;
}

/** starForce try/success 的 summaryIcon 為扁平 png 0–5（非 slot 子目錄） */
function parseFlatSummaryIcon(html) {
  const match = html.match(/<dir name="summaryIcon">([\s\S]*?)<\/dir>/);
  if (!match) return {};
  const frames = parsePngFrames(match[1]);
  return frames.length ? { summaryIcon: frames } : {};
}

function parseTextScreen(html) {
  const textMatch = html.match(/<dir name="textScreen">([\s\S]*?)<\/dir>/);
  if (!textMatch) return {};
  const frames = parsePngFrames(textMatch[1]);
  return frames.length ? { textScreen: frames } : {};
}

function parseTryPhaseBlock(html) {
  const item = parseItemIconLayers(html);
  const summary = parseFlatSummaryIcon(html);
  return {
    anchor: item.anchor,
    layers: { ...item.layers, ...summary },
  };
}

function parsePhaseBlock(html) {
  const item = parseItemIconLayers(html);
  const summary = parseFlatSummaryIcon(html);
  const text = parseTextScreen(html);
  return {
    anchor: item.anchor,
    layers: { ...item.layers, ...summary, ...text },
  };
}

function extractPhaseInner(tierBlock, phaseName, nextPhaseName) {
  const open = `<dir name="${phaseName}">`;
  const start = tierBlock.indexOf(open);
  if (start === -1) throw new Error(`missing phase: ${phaseName}`);
  const innerStart = start + open.length;
  if (!nextPhaseName) return tierBlock.slice(innerStart);
  const endNeedle = `<dir name="${nextPhaseName}">`;
  const end = tierBlock.indexOf(endNeedle, innerStart);
  if (end === -1) throw new Error(`missing end for phase: ${phaseName}`);
  return tierBlock.slice(innerStart, end);
}

function extractTierBlock(effectBlock, tier) {
  const open = `\n      <dir name="${tier}">`;
  const hit = effectBlock.indexOf(`effect/starForce/${tier}/try/itemIcon/front/0`);
  const start = effectBlock.lastIndexOf(open, hit);
  if (start === -1) throw new Error(`missing tier block: ${tier}`);
  const innerStart = start + open.length;
  const nextTier = String(parseInt(tier, 10) + 1);
  const nextOpen = `\n      <dir name="${nextTier}">`;
  const end = effectBlock.indexOf(nextOpen, innerStart);
  return end === -1 ? effectBlock.slice(innerStart) : effectBlock.slice(innerStart, end);
}

function parseTypeMapping(effectBlock) {
  const match = effectBlock.match(/<dir name="type">[\s\S]*?<dir name="normal">([\s\S]*?)<\/dir>/);
  if (!match) return {};
  const mapping = {};
  const intRe = /<int32 name="(\d+)" value="(\d+)"\s*\/>/g;
  let m;
  while ((m = intRe.exec(match[1])) !== null) {
    mapping[m[1]] = parseInt(m[2], 10);
  }
  return mapping;
}

function parseStarForceLayout(xml) {
  const block = extractStarForceLayoutBlock(xml);
  const layout = {};
  const vecRe = /<vector name="([^"]+)" value="([^"]+)"\s*\/>/g;
  let m;
  while ((m = vecRe.exec(block)) !== null) {
    layout[m[1]] = parseVector(m[2]);
  }
  const scaleM = block.match(/<int32 name="itemIconScale" value="(\d+)"/);
  if (scaleM) layout.itemIconScale = parseInt(scaleM[1], 10);

  const starSpace = {};
  const spaceM = block.match(/<dir name="summaryStar">[\s\S]*?<dir name="space">([\s\S]*?)<\/dir>/);
  if (spaceM) {
    const intRe = /<int32 name="([^"]+)" value="(-?\d+)"\s*\/>/g;
    let sm;
    while ((sm = intRe.exec(spaceM[1])) !== null) {
      starSpace[sm[1]] = parseInt(sm[2], 10);
    }
  }

  return {
    itemIcon: layout['vector:itemIcon'],
    itemName: layout['vector:itemName'],
    summary: layout['vector:summary'],
    textScreenOffset: layout['vector:textScreenOffset'] || { x: 214, y: 115 },
    effectAnchor: { x: 209, y: 114 },
    itemIconScale: layout.itemIconScale || 2,
    summaryStarSpace: starSpace,
  };
}

function fixTextScreenOutlinks(spec, tier, phase) {
  const textFrames = spec.layers?.textScreen;
  if (!textFrames?.length) return;
  spec.layers.textScreen = textFrames.map((f) => ({
    ...f,
    hasImg: true,
    outlink: `UI/_Canvas/Enchant.img/effect/starForce/${tier}/${phase}/textScreen/${f.i}`,
  }));
}

/** 本地素材比 XML 多出的 summaryIcon 帧（例如 8 张） */
function extendSummaryIconFromDisk(spec, tier, phase, assetBase, filePrefix) {
  const frames = spec.layers?.summaryIcon;
  if (!frames?.length) return;
  const dir = path.join(ROOT, assetBase, tier, phase, 'summaryIcon');
  if (!fs.existsSync(dir)) return;

  const existing = new Set(frames.map((f) => f.i));
  const files = fs.readdirSync(dir).filter((f) =>
    f.startsWith(`${filePrefix}.${tier}.${phase}.summaryIcon.`) && f.endsWith('.png')
  );
  const indices = files
    .map((f) => parseInt(f.match(/\.(\d+)\.png$/)?.[1] ?? '-1', 10))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);

  const fallback = frames[frames.length - 1];
  for (const i of indices) {
    if (existing.has(i)) continue;
    frames.push({
      i,
      o: fallback.o ? { ...fallback.o } : null,
      d: fallback.d ?? 60,
      hasImg: true,
      outlink: `UI/_Canvas/Enchant.img/effect/starForce/${tier}/${phase}/summaryIcon/${i}`,
    });
  }
  frames.sort((a, b) => a.i - b.i);
}

function layerSummary(layers) {
  const out = {};
  for (const [key, frames] of Object.entries(layers || {})) {
    const withImg = frames.filter((f) => f.hasImg);
    out[key] = {
      frameCount: frames.length,
      pngCount: withImg.length,
      uniqueOutlinks: [...new Set(withImg.map((f) => f.outlink).filter(Boolean))].length,
      delayMs: frames[0]?.d ?? 60,
    };
  }
  return out;
}

function stripForJson(spec) {
  if (spec == null || typeof spec !== 'object') return spec;
  if (Array.isArray(spec)) return spec;
  if (spec.layers) {
    const layers = {};
    for (const [k, frames] of Object.entries(spec.layers)) {
      layers[k] = frames.map(({ i, o, d, hasImg, outlink }) => ({
        i, o, d, hasImg, outlink,
      }));
    }
    return { anchor: spec.anchor, layers };
  }
  const out = {};
  for (const [k, v] of Object.entries(spec)) {
    out[k] = stripForJson(v);
  }
  return out;
}

function stripStarForceEffectData(data) {
  return {
    frameDelayMs: data.frameDelayMs,
    assetBase: data.assetBase,
    filePrefix: data.filePrefix,
    defaultTier: data.defaultTier,
    typeMapping: data.typeMapping,
    layout: data.layout,
    try: stripForJson(data.try),
    success: stripForJson(data.success),
    fail: stripForJson(data.fail),
  };
}

const xml = fs.readFileSync(XML, 'utf8');
const effectBlock = extractEffectStarForceBlock(xml);
const tierBlock = extractTierBlock(effectBlock, DEFAULT_TIER);
const typeMapping = parseTypeMapping(effectBlock);
const layout = parseStarForceLayout(xml);

const trySpec = parseTryPhaseBlock(extractPhaseInner(tierBlock, 'try', 'success'));
const successSpec = parsePhaseBlock(extractPhaseInner(tierBlock, 'success', 'fail'));
const failSpec = parsePhaseBlock(extractPhaseInner(tierBlock, 'fail', 'destroy'));
fixTextScreenOutlinks(successSpec, DEFAULT_TIER, 'success');
fixTextScreenOutlinks(failSpec, DEFAULT_TIER, 'fail');
extendSummaryIconFromDisk(successSpec, DEFAULT_TIER, 'success', 'images/starforce/effect', 'starForce');
extendSummaryIconFromDisk(trySpec, DEFAULT_TIER, 'try', 'images/starforce/effect', 'starForce');

const data = {
  frameDelayMs: 60,
  assetBase: 'images/starforce/effect',
  filePrefix: 'starForce',
  defaultTier: DEFAULT_TIER,
  typeMapping,
  layout,
  try: trySpec,
  success: successSpec,
  fail: failSpec,
};

const summary = {
  source: 'UI.Enchant.img.xml',
  sections: {
    'Enchant.img/starForce': '靜態 UI（約 line 281）',
    'Enchant.img/effect/starForce': '星力強化演出（約 line 14011）',
  },
  defaultTier: DEFAULT_TIER,
  typeMappingNote: '星數 → effect tier（type/normal）；素材僅 tier 1 時共用 defaultTier',
  layout,
  playbackFlow: [
    '1. 一般星力強化 → try（itemIcon 12帧）',
    '2. 成功 → success（itemIcon + summaryIcon + textScreen）',
    '3. 失敗/維持/降星 → fail（itemIcon + textScreen）',
  ],
  phases: {
    try: {
      durationMs: 12 * 60,
      layers: layerSummary(trySpec.layers),
      note: 'try 只播 itemIcon；summaryIcon ping-pong 無獨立素材',
    },
    success: {
      durationMs: 12 * 60,
      layers: layerSummary(successSpec.layers),
      hasTextScreen: Boolean(successSpec.layers?.textScreen),
    },
    fail: {
      durationMs: 12 * 60,
      layers: layerSummary(failSpec.layers),
      note: 'keep / drop 共用 fail 演出',
    },
  },
  assetPathPattern: {
    wzPrefix: `UI/_Canvas/Enchant.img/effect/starForce/${DEFAULT_TIER}/`,
    local: `images/starforce/effect/${DEFAULT_TIER}/{phase}/...`,
    example: `images/starforce/effect/${DEFAULT_TIER}/try/itemIcon/front/starForce.${DEFAULT_TIER}.try.itemIcon.front.0.png`,
  },
};

const js = `/** 自動生成：星力強化動畫（scripts/extract-starforce-effect-frames.mjs） */
const STARFORCE_EFFECT = ${JSON.stringify(stripStarForceEffectData(data), null, 2)};

function starForceEffectAssetPath(tier, phase, layer, frameIndex) {
  const base = STARFORCE_EFFECT.assetBase;
  const prefix = STARFORCE_EFFECT.filePrefix;
  const t = tier ?? STARFORCE_EFFECT.defaultTier;
  if (layer === 'textScreen') {
    return \`\${base}/\${t}/\${phase}/textScreen/\${prefix}.\${t}.\${phase}.textScreen.\${frameIndex}.png\`;
  }
  if (layer === 'summaryIcon') {
    return \`\${base}/\${t}/\${phase}/summaryIcon/\${prefix}.\${t}.\${phase}.summaryIcon.\${frameIndex}.png\`;
  }
  const part = layer.replace('itemIcon/', '');
  return \`\${base}/\${t}/\${phase}/itemIcon/\${part}/\${prefix}.\${t}.\${phase}.itemIcon.\${part}.\${frameIndex}.png\`;
}
`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JS, js, 'utf8');
fs.writeFileSync(OUT_JSON, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log('Wrote', OUT_JS);
console.log('Wrote', OUT_JSON);
console.log('tier:', DEFAULT_TIER);
console.log('try layers:', Object.keys(trySpec.layers).join(', '));
console.log('success layers:', Object.keys(successSpec.layers).join(', '));
console.log('fail layers:', Object.keys(failSpec.layers).join(', '));
