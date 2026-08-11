/**
 * 從 UI.Enchant.img.xml 提取鐵鎚強化次數追加動畫（try / success / fail）
 * 用法: node scripts/extract-hammer-effect-frames.mjs [xmlPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT_JS = path.join(ROOT, 'js', 'hammerEffectData.js');
const OUT_JSON = path.join(ROOT, 'data', 'hammer-enchant-summary.json');

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractEffectHammerBlock(xml) {
  const hit = xml.indexOf('effect/hammer/try/itemIcon/front/0');
  if (hit === -1) throw new Error('missing effect/hammer block');
  const start = xml.lastIndexOf('<dir name="hammer">', hit);
  const end = xml.indexOf('<dir name="cubewz2">', hit);
  if (start === -1 || end === -1) throw new Error('cannot slice effect/hammer block');
  return xml.slice(start, end);
}

function extractHammerLayoutBlock(xml) {
  const hit = xml.indexOf('Enchant.img/hammer/backgrnd');
  if (hit === -1) throw new Error('missing Enchant.img/hammer layout block');
  const start = xml.lastIndexOf('<dir name="hammer">', hit);
  const end = xml.indexOf('\n  <dir name="fullScreen_uni">', start);
  if (start === -1 || end === -1) throw new Error('cannot slice hammer layout block');
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

function parseSummaryIconLayers(html, slots = ['0', '1', '2']) {
  const summary = {};
  const slotRe = /<dir name="summaryIcon">([\s\S]*?)<\/dir>\s*(?:<dir name="textScreen">|<dir name="whiteGoldHammerSummaryIcon">|<\/dir>\s*<\/dir>)/;
  const slotBlock = html.match(slotRe)?.[1] || html.match(/<dir name="summaryIcon">([\s\S]*)/)?.[1];
  if (!slotBlock) return summary;

  for (const slot of slots) {
    const slotMatch = slotBlock.match(new RegExp(`<dir name="${slot}">([\\s\\S]*?)(?=<dir name="|$)`));
    if (!slotMatch) continue;
    const frames = parsePngFrames(slotMatch[1]);
    if (frames.length) summary[`summaryIcon/${slot}`] = frames;
  }
  return summary;
}

function parseWhiteGoldSummaryIcon(html) {
  const match = html.match(/<dir name="whiteGoldHammerSummaryIcon">([\s\S]*?)<\/dir>\s*<\/dir>/);
  if (!match) return {};
  const summary = {};
  for (const slot of ['0', '1']) {
    const slotMatch = match[1].match(new RegExp(`<dir name="${slot}">([\\s\\S]*?)(?=<dir name="|$)`));
    if (!slotMatch) continue;
    const frames = parsePngFrames(slotMatch[1]);
    if (frames.length) summary[`whiteGoldHammerSummaryIcon/${slot}`] = frames;
  }
  return summary;
}

function parseTextScreen(html) {
  const textMatch = html.match(/<dir name="textScreen">([\s\S]*?)<\/dir>/);
  if (!textMatch) return {};
  const frames = parsePngFrames(textMatch[1]);
  return frames.length ? { textScreen: frames } : {};
}

function parseTryPhaseBlock(html) {
  const item = parseItemIconLayers(html);
  const summary = parseSummaryIconLayers(html, ['0', '1']);
  const whiteGold = parseWhiteGoldSummaryIcon(html);
  return {
    anchor: item.anchor,
    layers: { ...item.layers, ...summary, ...whiteGold },
  };
}

function parsePhaseBlock(html) {
  const item = parseItemIconLayers(html);
  const summary = parseSummaryIconLayers(html);
  const text = parseTextScreen(html);
  return {
    anchor: item.anchor,
    layers: { ...item.layers, ...summary, ...text },
  };
}

function extractPhaseInner(block, phaseName, nextPhaseName) {
  const open = `<dir name="${phaseName}">`;
  const start = block.indexOf(open);
  if (start === -1) throw new Error(`missing phase: ${phaseName}`);
  const innerStart = start + open.length;
  if (!nextPhaseName) return block.slice(innerStart);
  const endNeedle = `<dir name="${nextPhaseName}">`;
  const end = block.indexOf(endNeedle, innerStart);
  if (end === -1) throw new Error(`missing end for phase: ${phaseName}`);
  return block.slice(innerStart, end);
}

function parseSuccessVariants(successBlock) {
  const variants = {};
  for (const idx of ['0', '1', '2']) {
    const open = `\n        <dir name="${idx}">`;
    const start = successBlock.indexOf(open);
    if (start === -1) continue;
    const innerStart = start + open.length;
    let end = successBlock.length;
    const nextIdx = String(parseInt(idx, 10) + 1);
    const nextOpen = `\n        <dir name="${nextIdx}">`;
    const nextPos = successBlock.indexOf(nextOpen, innerStart);
    if (nextPos !== -1) end = nextPos;
    else {
      const failPos = successBlock.indexOf('\n      <dir name="fail">', innerStart);
      if (failPos !== -1) end = failPos;
    }
    variants[idx] = parsePhaseBlock(successBlock.slice(innerStart, end));
    const textFrames = variants[idx].layers?.textScreen;
    if (textFrames?.length) {
      variants[idx].layers.textScreen = textFrames.map((f) => ({
        ...f,
        hasImg: true,
        outlink: `UI/_Canvas/Enchant.img/effect/hammer/success/${idx}/textScreen/${f.i}`,
      }));
    }
  }
  return variants;
}

function parseHammerLayout(xml) {
  const block = extractHammerLayoutBlock(xml);
  const layout = {};
  const vecRe = /<vector name="([^"]+)" value="([^"]+)"\s*\/>/g;
  let m;
  while ((m = vecRe.exec(block)) !== null) {
    layout[m[1]] = parseVector(m[2]);
  }
  const scaleM = block.match(/<int32 name="itemIconScale" value="(\d+)"/);
  if (scaleM) layout.itemIconScale = parseInt(scaleM[1], 10);

  const summarySpaces = {};
  for (const slot of ['0', '1']) {
    const spaceM = block.match(new RegExp(`<dir name="${slot}">[\\s\\S]*?<dir name="space">([\\s\\S]*?)<\\/dir>`));
    if (!spaceM) continue;
    const space = {};
    const intRe = /<int32 name="([^"]+)" value="(-?\d+)"\s*\/>/g;
    let sm;
    while ((sm = intRe.exec(spaceM[1])) !== null) {
      space[sm[1]] = parseInt(sm[2], 10);
    }
    if (Object.keys(space).length) summarySpaces[slot] = space;
  }

  return {
    itemIcon: layout['vector:itemIcon'],
    itemName: layout['vector:itemName'],
    summary: layout['vector:summary'],
    textScreenOffset: layout['vector:textScreenOffset'] || { x: 214, y: 115 },
    effectAnchor: { x: 209, y: 114 },
    itemIconScale: layout.itemIconScale || 2,
    summaryIconSpaces: summarySpaces,
  };
}

function countUniqueOutlinks(spec) {
  const urls = new Set();
  const walk = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (obj.outlink) urls.add(obj.outlink);
    if (obj.layers) Object.values(obj.layers).forEach(walk);
    if (typeof obj === 'object') Object.values(obj).forEach((v) => {
      if (v && typeof v === 'object') walk(v);
    });
  };
  walk(spec);
  return urls.size;
}

function collectHammerOutlinks(spec) {
  const urls = new Set();
  const walk = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (obj.outlink && obj.outlink.includes('/effect/hammer/')) urls.add(obj.outlink);
    if (obj.layers) Object.values(obj.layers).forEach(walk);
    if (typeof obj === 'object') Object.values(obj).forEach((v) => {
      if (v && typeof v === 'object') walk(v);
    });
  };
  walk(spec);
  return [...urls].sort();
}

function layerSummary(layers) {
  const out = {};
  for (const [key, frames] of Object.entries(layers || {})) {
    const withImg = frames.filter((f) => f.hasImg);
    const uniqueOutlinks = [...new Set(withImg.map((f) => f.outlink).filter(Boolean))];
    out[key] = {
      frameCount: frames.length,
      pngCount: withImg.length,
      uniqueOutlinks: uniqueOutlinks.length,
      uniquePngIndices: uniqueOutlinks.map((u) => u.split('/').pop()),
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

function stripHammerEffectData(data) {
  return {
    frameDelayMs: data.frameDelayMs,
    assetBase: data.assetBase,
    filePrefix: data.filePrefix,
    layout: data.layout,
    try: stripForJson(data.try),
    success: Object.fromEntries(
      Object.entries(data.success).map(([k, v]) => [k, stripForJson(v)])
    ),
    fail: stripForJson(data.fail),
  };
}

const xml = fs.readFileSync(XML, 'utf8');
const effectBlock = extractEffectHammerBlock(xml);

const trySpec = parseTryPhaseBlock(extractPhaseInner(effectBlock, 'try', 'success'));
const successVariants = parseSuccessVariants(extractPhaseInner(effectBlock, 'success', 'fail'));
const failSpec = parsePhaseBlock(extractPhaseInner(effectBlock, 'fail', null));
const layout = parseHammerLayout(xml);

const data = {
  frameDelayMs: 60,
  assetBase: 'images/hammer/effect',
  filePrefix: 'hammer',
  layout,
  try: trySpec,
  success: successVariants,
  fail: failSpec,
};

const hammerOnlyOutlinks = [
  ...collectHammerOutlinks(trySpec),
  ...Object.values(successVariants).flatMap(collectHammerOutlinks),
  ...collectHammerOutlinks(failSpec),
].filter((v, i, a) => a.indexOf(v) === i);

const summary = {
  source: 'UI.Enchant.img.xml',
  sections: {
    'Enchant.img/hammer': '靜態 UI（約 line 74098）',
    'Enchant.img/effect/hammer': '鐵鎚強化演出（約 line 37746–40689）',
  },
  layout,
  playbackFlow: [
    '1. 使用鐵鎚 → try（itemIcon 12帧；summary 6帧 ping-pong，120ms）',
    '2. 成功 → success/0、success/1 或 success/2（依追加的第幾格次數）',
    '3. 失敗 → fail',
  ],
  phases: {
    try: {
      durationMs: 12 * 60,
      layers: layerSummary(trySpec.layers),
      note: 'try 只播 itemIcon；summaryIcon 為 ping-pong（0→3→2→1）；whiteGoldHammerSummaryIcon 與 summaryIcon 共用素材',
    },
    success: {
      variants: Object.fromEntries(
        Object.entries(successVariants).map(([v, spec]) => [
          v,
          {
            meaning: `追加第 ${parseInt(v, 10) + 1} 格次數成功`,
            durationMs: 12 * 60,
            layers: layerSummary(spec.layers),
            hasTextScreen: Boolean(spec.layers?.textScreen),
            hammerOwnSummarySlots: Object.keys(spec.layers || {}).filter((k) =>
              k.startsWith('summaryIcon/') &&
              spec.layers[k].some((f) => f.outlink?.includes('/effect/hammer/'))
            ),
          },
        ])
      ),
    },
    fail: {
      durationMs: 12 * 60,
      layers: layerSummary(failSpec.layers),
      reuse: {
        'itemIcon/front': 'effect/starForce/0/fail/itemIcon/front',
        'itemIcon/back': '（空帧，無素材）',
        'summaryIcon/0、summaryIcon/1': 'effect/scroll/fail/summaryIcon',
        textScreen: 'effect/starForce/0/fail/textScreen',
      },
    },
  },
  renderStack: [
    'itemIcon/back（success 才有；try 無 back）',
    '裝備圖示（itemIconScale=2，vector:itemIcon 166,112）',
    'itemIcon/front',
    'summaryIcon（對齊 vector:summary 209,260）',
    'textScreen（success、fail；offset 214,115）',
  ],
  assetPathPattern: {
    wzPrefix: 'UI/_Canvas/Enchant.img/effect/hammer/',
    local: 'images/hammer/effect/{phase}/...',
    example: 'images/hammer/effect/try/itemIcon/front/hammer.try.itemIcon.front.0.png',
  },
  hammerOnlyAssets: hammerOnlyOutlinks.map((outlink) => {
    const rel = outlink.replace('UI/_Canvas/Enchant.img/effect/hammer/', '');
    const parts = rel.split('/');
    const file = parts.pop();
    const dir = parts.join('/');
    return {
      wz: outlink,
      local: `images/hammer/effect/${dir}/hammer.${dir.replace(/\//g, '.')}.${file}.png`,
    };
  }),
  totalUniqueOutlinks: {
    try: countUniqueOutlinks(trySpec),
    success0: countUniqueOutlinks(successVariants[0]),
    success1: countUniqueOutlinks(successVariants[1]),
    success2: countUniqueOutlinks(successVariants[2]),
    fail: countUniqueOutlinks(failSpec),
    hammerOnly: hammerOnlyOutlinks.length,
  },
};

const js = `/** 自動生成：鐵鎚強化動畫（scripts/extract-hammer-effect-frames.mjs） */
const HAMMER_EFFECT = ${JSON.stringify(stripHammerEffectData(data), null, 2)};

function hammerEffectAssetPath(phase, variant, layer, frameIndex) {
  const base = HAMMER_EFFECT.assetBase;
  const prefix = HAMMER_EFFECT.filePrefix;
  if (phase === 'try' || phase === 'fail') {
    if (layer.startsWith('summaryIcon/') || layer.startsWith('whiteGoldHammerSummaryIcon/')) {
      const slot = layer.split('/')[1];
      const layerKey = layer.replace('/', '.');
      return \`\${base}/\${phase}/\${layer.split('/')[0]}/\${slot}/\${prefix}.\${phase}.\${layerKey}.\${frameIndex}.png\`;
    }
    if (layer === 'textScreen') {
      return \`\${base}/\${phase}/textScreen/\${prefix}.\${phase}.textScreen.\${frameIndex}.png\`;
    }
    const part = layer.replace('itemIcon/', '');
    return \`\${base}/\${phase}/itemIcon/\${part}/\${prefix}.\${phase}.itemIcon.\${part}.\${frameIndex}.png\`;
  }
  if (phase === 'success') {
    const v = variant ?? 0;
    if (layer.startsWith('summaryIcon/')) {
      const slot = layer.split('/')[1];
      return \`\${base}/success/\${v}/summaryIcon/\${slot}/\${prefix}.success.\${v}.summaryIcon.\${slot}.\${frameIndex}.png\`;
    }
    if (layer === 'textScreen') {
      return \`\${base}/success/\${v}/textScreen/\${prefix}.success.\${v}.textScreen.\${frameIndex}.png\`;
    }
    const part = layer.replace('itemIcon/', '');
    return \`\${base}/success/\${v}/itemIcon/\${part}/\${prefix}.success.\${v}.itemIcon.\${part}.\${frameIndex}.png\`;
  }
  return '';
}
`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JS, js, 'utf8');
fs.writeFileSync(OUT_JSON, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log('Wrote', OUT_JS);
console.log('Wrote', OUT_JSON);
console.log('try layers:', Object.keys(trySpec.layers).join(', '));
console.log('success variants:', Object.keys(successVariants).join(', '));
console.log('fail layers:', Object.keys(failSpec.layers).join(', '));
console.log('hammer-only PNG count:', hammerOnlyOutlinks.length);
