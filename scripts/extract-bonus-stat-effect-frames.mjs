/**
 * 從 UI.Enchant.img.xml 提取星火強化動畫（try / success/0|1）
 * 用法: node scripts/extract-bonus-stat-effect-frames.mjs [xmlPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT_JS = path.join(ROOT, 'js', 'bonusStatEffectData.js');
const OUT_JSON = path.join(ROOT, 'data', 'bonus-stat-enchant-summary.json');

const VARIANTS = ['normal', 'powerful', 'eternal', 'black', 'abyss'];

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractEffectBonusStatBlock(xml) {
  const hit = xml.indexOf('effect/bonusStat/normal/try/itemIcon/front/0');
  if (hit === -1) throw new Error('missing effect/bonusStat block');
  const start = xml.lastIndexOf('<dir name="bonusStat">', hit);
  const end = xml.indexOf('\n    <dir name="potential">', hit);
  if (start === -1 || end === -1) throw new Error('cannot slice effect/bonusStat block');
  return xml.slice(start, end);
}

function extractBonusStatLayoutBlock(xml) {
  const hit = xml.indexOf('Enchant.img/bonusStat/backgrnd');
  if (hit === -1) throw new Error('missing Enchant.img/bonusStat layout block');
  const start = xml.lastIndexOf('\n  <dir name="bonusStat">', hit);
  const end = xml.indexOf('\n  <dir name="fullScreen_bonusStat">', start);
  if (start === -1 || end === -1) throw new Error('cannot slice bonusStat layout block');
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

function parseTextScreen(html) {
  const textMatch = html.match(/<dir name="textScreen">([\s\S]*?)<\/dir>/);
  if (!textMatch) return {};
  const frames = parsePngFrames(textMatch[1]);
  return frames.length ? { textScreen: frames } : {};
}

function parsePhaseBlock(html) {
  const item = parseItemIconLayers(html);
  const text = parseTextScreen(html);
  return {
    anchor: item.anchor,
    layers: { ...item.layers, ...text },
  };
}

function parseSuccessVariants(successBlock) {
  const variants = {};
  for (const idx of ['0', '1']) {
    const hit = successBlock.indexOf(`effect/bonusStat/`);
    const open = `\n          <dir name="${idx}">`;
    const start = successBlock.indexOf(open);
    if (start === -1) continue;
    const innerStart = start + open.length;
    let end = successBlock.length;
    const nextOpen = idx === '0' ? '\n          <dir name="1">' : null;
    if (nextOpen) {
      const nextPos = successBlock.indexOf(nextOpen, innerStart);
      if (nextPos !== -1) end = nextPos;
    }
    const slice = successBlock.slice(innerStart, end);
    if (!slice.includes('itemIcon')) continue;
    variants[idx] = parsePhaseBlock(slice);
  }
  return variants;
}

function parseVariantBlock(variantBlock, variantName) {
  const tryHit = variantBlock.indexOf('<dir name="try">');
  const successHit = variantBlock.indexOf('<dir name="success">');
  if (tryHit === -1 || successHit === -1) {
    throw new Error(`missing try/success in variant ${variantName}`);
  }

  const tryInnerStart = tryHit + '<dir name="try">'.length;
  const trySpec = parsePhaseBlock(variantBlock.slice(tryInnerStart, successHit));

  const successInnerStart = successHit + '<dir name="success">'.length;
  const successVariants = parseSuccessVariants(variantBlock.slice(successInnerStart));

  return { try: trySpec, success: successVariants };
}

function parseBonusStatLayout(xml) {
  const block = extractBonusStatLayoutBlock(xml);
  const itemIconM = block.match(/<vector name="vector:itemIcon" value="([^"]+)"/);
  const itemNameM = block.match(/<vector name="vector:itemName" value="([^"]+)"/);
  const scaleM = block.match(/<int32 name="itemIconScale" value="(\d+)"/);
  const textOffsetM = block.match(/<vector name="vector:textScreenOffset" value="([^"]+)"/);

  return {
    itemIcon: itemIconM ? parseVector(itemIconM[1]) : { x: 166, y: 112 },
    itemName: itemNameM ? parseVector(itemNameM[1]) : { x: 200, y: 155 },
    textScreenOffset: textOffsetM ? parseVector(textOffsetM[1]) : { x: 214, y: 115 },
    effectAnchor: { x: 209, y: 114 },
    itemIconScale: scaleM ? parseInt(scaleM[1], 10) : 2,
  };
}

function stripForJson(spec) {
  if (!spec?.layers) return spec;
  const layers = {};
  for (const [k, frames] of Object.entries(spec.layers)) {
    layers[k] = frames.map(({ i, o, d, hasImg, outlink }) => ({ i, o, d, hasImg, outlink }));
  }
  return { anchor: spec.anchor, layers };
}

function layerSummary(layers) {
  const out = {};
  for (const [key, frames] of Object.entries(layers || {})) {
    const withImg = frames.filter((f) => f.hasImg);
    out[key] = {
      frameCount: frames.length,
      pngCount: withImg.length,
    };
  }
  return out;
}

const xml = fs.readFileSync(XML, 'utf8');
const effectBlock = extractEffectBonusStatBlock(xml);
const layout = parseBonusStatLayout(xml);

const byVariant = {};
VARIANTS.forEach((variant) => {
  const open = `<dir name="${variant}">`;
  const start = effectBlock.indexOf(open);
  if (start === -1) return;
  const innerStart = start + open.length;
  let end = effectBlock.length;
  const idx = VARIANTS.indexOf(variant);
  if (idx >= 0 && idx < VARIANTS.length - 1) {
    const next = `<dir name="${VARIANTS[idx + 1]}">`;
    const nextPos = effectBlock.indexOf(next, innerStart);
    if (nextPos !== -1) end = nextPos;
  }
  byVariant[variant] = parseVariantBlock(effectBlock.slice(innerStart, end), variant);
});

const data = {
  frameDelayMs: 60,
  assetBase: 'images/bonusStat/effect',
  filePrefix: 'effect.bonusStat',
  starFireTypeMap: {
    enhanced: 'normal',
    eternal: 'eternal',
    awakened: 'powerful',
    blackAwakened: 'black',
  },
  layout,
  variants: byVariant,
};

const summary = {
  source: 'UI.Enchant.img.xml / Enchant.img/effect/bonusStat',
  variants: Object.fromEntries(
    Object.entries(byVariant).map(([name, spec]) => [
      name,
      {
        try: layerSummary(spec.try.layers),
        success: Object.fromEntries(
          Object.entries(spec.success).map(([v, s]) => [v, layerSummary(s.layers)])
        ),
      },
    ])
  ),
  playbackFlow: [
    '1. 重新設定 → try（12帧 × 60ms）',
    '2. 直接套用 → success/0（含 SUCCESS 字）',
    '3. BEFORE/AFTER 選擇 → success/1',
  ],
};

const js = `/** 自動生成：星火強化動畫（scripts/extract-bonus-stat-effect-frames.mjs） */
const BONUS_STAT_EFFECT = ${JSON.stringify({
  frameDelayMs: data.frameDelayMs,
  assetBase: data.assetBase,
  filePrefix: data.filePrefix,
  starFireTypeMap: data.starFireTypeMap,
  layout: data.layout,
  variants: Object.fromEntries(
    Object.entries(byVariant).map(([k, v]) => [
      k,
      { try: stripForJson(v.try), success: Object.fromEntries(Object.entries(v.success).map(([sv, s]) => [sv, stripForJson(s)])) },
    ])
  ),
}, null, 2)};

function getBonusStatEffectVariant(starFireType) {
  const map = BONUS_STAT_EFFECT.starFireTypeMap || {};
  return map[starFireType] || map.enhanced || 'normal';
}

function bonusStatEffectAssetPath(variant, phase, successVariant, layerKey, frameIndex) {
  const base = BONUS_STAT_EFFECT.assetBase;
  const prefix = BONUS_STAT_EFFECT.filePrefix;
  if (phase === 'try') {
    const part = layerKey.replace('itemIcon/', '');
    return \`\${base}/\${variant}/try/itemIcon/\${part}/\${prefix}.\${variant}.try.itemIcon.\${part}.\${frameIndex}.png\`;
  }
  if (phase === 'success') {
    const v = successVariant ?? 0;
    if (layerKey === 'textScreen') {
      return \`\${base}/\${variant}/success/\${v}/textScreen/\${prefix}.\${variant}.success.\${v}.textScreen.\${frameIndex}.png\`;
    }
    const part = layerKey.replace('itemIcon/', '');
    return \`\${base}/\${variant}/success/\${v}/itemIcon/\${part}/\${prefix}.\${variant}.success.\${v}.itemIcon.\${part}.\${frameIndex}.png\`;
  }
  return '';
}
`;

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JS, js, 'utf8');
fs.writeFileSync(OUT_JSON, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log('Wrote', OUT_JS);
console.log('Wrote', OUT_JSON);
console.log('variants:', Object.keys(byVariant).join(', '));
