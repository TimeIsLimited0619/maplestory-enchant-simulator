/**
 * 從 UI.Enchant.img.xml 提取卷軸強化動畫（try / success / fail）
 * 用法: node scripts/extract-scroll-effect-frames.mjs [xmlPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT_JS = path.join(ROOT, 'js', 'scrollEffectData.js');
const OUT_JSON = path.join(ROOT, 'data', 'scroll-enchant-summary.json');

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractBlock(xml, startNeedle, endNeedle) {
  const start = xml.indexOf(startNeedle);
  if (start === -1) throw new Error(`missing block: ${startNeedle}`);
  const end = xml.indexOf(endNeedle, start + startNeedle.length);
  return end === -1 ? xml.slice(start) : xml.slice(start, end);
}

function extractEffectScrollBlock(xml) {
  const hit = xml.indexOf('effect/scroll/try/itemIcon/front/0');
  if (hit === -1) throw new Error('missing effect/scroll block');
  const start = xml.lastIndexOf('<dir name="scroll">', hit);
  const end = xml.indexOf('<dir name="meltDown">', hit);
  if (start === -1 || end === -1) throw new Error('cannot slice effect/scroll block');
  return xml.slice(start, end);
}

function extractScrollLayoutBlock(xml) {
  const hit = xml.indexOf('Enchant.img/scroll/layer:summaryBox');
  if (hit === -1) throw new Error('missing Enchant.img/scroll layout block');
  const start = xml.lastIndexOf('<dir name="scroll">', hit);
  const end = xml.indexOf('\n  <dir name="bonusStat">', start);
  if (start === -1 || end === -1) throw new Error('cannot slice scroll layout block');
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

function parseSummaryIconLayers(html) {
  const summary = {};
  const slotRe = /<dir name="summaryIcon">([\s\S]*?)<\/dir>\s*(?:<dir name="textScreen">|<\/dir>\s*<\/dir>)/;
  const slotBlock = html.match(slotRe)?.[1] || html.match(/<dir name="summaryIcon">([\s\S]*)/)?.[1];
  if (!slotBlock) return summary;

  for (const slot of ['0', '1']) {
    const slotMatch = slotBlock.match(new RegExp(`<dir name="${slot}">([\\s\\S]*?)(?=<dir name="|$)`));
    if (!slotMatch) continue;
    const frames = parsePngFrames(slotMatch[1]);
    if (frames.length) summary[`summaryIcon/${slot}`] = frames;
  }
  return summary;
}

function parseTextScreen(html) {
  const textMatch = html.match(/<dir name="textScreen">([\s\S]*?)<\/dir>/);
  if (!textMatch) return {};
  const frames = parsePngFrames(textMatch[1]);
  return frames.length ? { textScreen: frames } : {};
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
  for (const idx of ['0', '1']) {
    const hit = successBlock.indexOf(`effect/scroll/success/${idx}/itemIcon/front/0`);
    if (hit === -1) continue;
    const open = `\n        <dir name="${idx}">`;
    const start = successBlock.lastIndexOf(open, hit);
    if (start === -1) continue;
    const innerStart = start + open.length;
    let end = successBlock.length;
    if (idx === '0') {
      const nextOpen = '\n        <dir name="1">';
      const nextPos = successBlock.indexOf(nextOpen, hit + 1);
      if (nextPos !== -1) end = nextPos;
    }
    variants[idx] = parsePhaseBlock(successBlock.slice(innerStart, end));
    const textFrames = variants[idx].layers?.textScreen;
    if (textFrames?.length) {
      const ownText = textFrames.some(
        (f) => f.outlink && f.outlink.includes(`/success/${idx}/textScreen/`)
      );
      if (!ownText) delete variants[idx].layers.textScreen;
    }
  }
  return variants;
}

function parseScrollLayout(xml) {
  const block = extractScrollLayoutBlock(xml);
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
    textScreenOffset: layout['vector:textScreenOffset'],
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

function layerSummary(layers) {
  const out = {};
  for (const [key, frames] of Object.entries(layers || {})) {
    const withImg = frames.filter((f) => f.hasImg);
    out[key] = {
      frameCount: frames.length,
      pngCount: withImg.length,
      uniqueOutlinks: [...new Set(withImg.map((f) => f.outlink).filter(Boolean))].length,
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

function stripScrollEffectData(data) {
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
const effectBlock = extractEffectScrollBlock(xml);

const trySpec = parsePhaseBlock(extractPhaseInner(effectBlock, 'try', 'success'));
const successVariants = parseSuccessVariants(extractPhaseInner(effectBlock, 'success', 'fail'));
const failSpec = parsePhaseBlock(extractPhaseInner(effectBlock, 'fail', null));

const layout = parseScrollLayout(xml);

const data = {
  frameDelayMs: 60,
  assetBase: 'images/scroll',
  filePrefix: 'effect.scroll',
  layout,
  try: trySpec,
  success: successVariants,
  fail: failSpec,
};

const summary = {
  source: 'UI.Enchant.img.xml',
  sections: {
    'Enchant.img/scroll': '靜態 UI（約 line 1199）',
    'Enchant.img/effect/scroll': '卷軸強化演出（約 line 22537，不含 meltDown）',
  },
  layout,
  playbackFlow: [
    '1. 使用卷軸 → try（12帧 × 60ms）',
    '2. 成功 → success/0（第一排成功）或 success/1（第二排成功）',
    '3. 失敗 → fail',
  ],
  phases: {
    try: {
      durationMs: 12 * 60,
      layers: layerSummary(trySpec.layers),
      note: 'summaryIcon 各 slot 僅 6 帧（0–5），itemIcon 為 12 帧；summary 在 try 時閃爍預覽',
    },
    success: {
      variants: Object.fromEntries(
        Object.entries(successVariants).map(([v, spec]) => [
          v,
          {
            meaning: v === '0' ? '第一排卷軸成功（含 SUCCESS 字 + 爆光）' : '第二排卷軸成功（無 textScreen）',
            durationMs: 12 * 60,
            layers: layerSummary(spec.layers),
            hasTextScreen: Boolean(spec.layers?.textScreen),
          },
        ])
      ),
    },
    fail: {
      durationMs: 12 * 60,
      layers: layerSummary(failSpec.layers),
      reuse: {
        'itemIcon/front': 'effect/starForce/0/fail/itemIcon/front',
        textScreen: 'effect/starForce/0/fail/textScreen',
      },
      note: 'summaryIcon 為 scroll 專用；itemIcon 光效與 fail 字共用 starForce',
    },
  },
  renderStack: [
    'itemIcon/back',
    '裝備圖示（itemIconScale=2，vector:itemIcon 166,112）',
    'itemIcon/front',
    'summaryIcon/0、summaryIcon/1（對齊 vector:summary 209,260 附近）',
    'textScreen（success/0、fail；textScreenOffset 214,115）',
  ],
  assetPathPattern: {
    wzPrefix: 'UI/_Canvas/Enchant.img/effect/scroll/',
    local: 'images/scroll/{phase}/...',
    example: 'images/scroll/try/itemIcon/front/effect.scroll.try.itemIcon.front.0.png',
  },
  totalUniqueOutlinks: {
    try: countUniqueOutlinks(trySpec),
    success0: countUniqueOutlinks(successVariants[0]),
    success1: countUniqueOutlinks(successVariants[1]),
    fail: countUniqueOutlinks(failSpec),
  },
};

function scrollEffectAssetPath(phase, variant, layer, frameIndex, slotIndex) {
  const base = data.assetBase;
  const prefix = data.filePrefix;
  if (phase === 'try' || phase === 'fail') {
    if (layer.startsWith('summaryIcon/')) {
      const slot = layer.split('/')[1];
      return `${base}/${phase}/summaryIcon/${slot}/effect.scroll.${phase}.summaryIcon.${slot}.${frameIndex}.png`;
    }
    if (layer === 'textScreen') {
      return `${base}/${phase}/textScreen/effect.scroll.${phase}.textScreen.${frameIndex}.png`;
    }
    const part = layer.replace('itemIcon/', '');
    return `${base}/${phase}/itemIcon/${part}/effect.scroll.${phase}.itemIcon.${part}.${frameIndex}.png`;
  }
  if (phase === 'success') {
    const v = variant ?? 0;
    if (layer.startsWith('summaryIcon/')) {
      const slot = layer.split('/')[1];
      return `${base}/success/${v}/summaryIcon/${slot}/effect.scroll.success.${v}.summaryIcon.${slot}.${frameIndex}.png`;
    }
    if (layer === 'textScreen') {
      return `${base}/success/${v}/textScreen/effect.scroll.success.${v}.textScreen.${frameIndex}.png`;
    }
    const part = layer.replace('itemIcon/', '');
    return `${base}/success/${v}/itemIcon/${part}/effect.scroll.success.${v}.itemIcon.${part}.${frameIndex}.png`;
  }
  return '';
}

const js = `/** 自動生成：卷軸強化動畫（scripts/extract-scroll-effect-frames.mjs） */
const SCROLL_EFFECT = ${JSON.stringify(stripScrollEffectData(data), null, 2)};

function scrollEffectAssetPath(phase, variant, layer, frameIndex) {
  const base = SCROLL_EFFECT.assetBase;
  const prefix = SCROLL_EFFECT.filePrefix;
  if (phase === 'try' || phase === 'fail') {
    if (layer.startsWith('summaryIcon/')) {
      const slot = layer.split('/')[1];
      return \`\${base}/\${phase}/summaryIcon/\${slot}/\${prefix}.\${phase}.summaryIcon.\${slot}.\${frameIndex}.png\`;
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
