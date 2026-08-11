/**
 * 從 UI.Enchant.img.xml 提取卓越強化動畫
 * 用法: node scripts/extract-exceptional-effect-frames.mjs [xmlPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT_JS = path.join(ROOT, 'js', 'exceptionalEffectData.js');
const EFFECT_DIR = path.join(ROOT, 'images', 'exceptional', 'effect');

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractEffectExceptionalBlock(xml) {
  const hit = xml.indexOf('effect/exceptional/enchant');
  if (hit === -1) throw new Error('missing effect/exceptional block');
  const start = xml.lastIndexOf('<dir name="exceptional">', hit);
  if (start === -1) throw new Error('cannot find effect exceptional dir');

  let depth = 0;
  const re = /<(\/?)dir\b/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(xml)) !== null) {
    depth += m[1] === '' ? 1 : -1;
    if (depth === 0) {
      const end = xml.indexOf('>', m.index) + 1;
      return xml.slice(start, end);
    }
  }
  throw new Error('unclosed effect exceptional block');
}

function extractLayoutBlock(xml) {
  const hit = xml.indexOf('Enchant.img/exceptional/backgrnd');
  if (hit === -1) throw new Error('missing exceptional layout');
  const start = xml.lastIndexOf('<dir name="exceptional">', hit);
  const end = xml.indexOf('\n  <dir name="soulWeapon">', start);
  if (start === -1 || end === -1) throw new Error('cannot slice exceptional layout');
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
    const layerMatch = html.match(
      new RegExp(`<dir name="${layer}">([\\s\\S]*?)<\\/dir>\\s*(?:<dir name="|$)`)
    );
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

function extractNamedDir(block, name) {
  const open = `<dir name="${name}">`;
  const start = block.indexOf(open);
  if (start === -1) return null;
  let depth = 0;
  const re = /<(\/?)dir\b/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(block)) !== null) {
    depth += m[1] === '' ? 1 : -1;
    if (depth === 0) {
      const end = block.indexOf('>', m.index) + 1;
      return block.slice(start + open.length, end - '</dir>'.length);
    }
  }
  return null;
}

function localFileExists(name) {
  return fs.existsSync(path.join(EFFECT_DIR, name));
}

function annotateFrames(spec) {
  if (!spec?.layers) return spec;
  Object.values(spec.layers).forEach((frames) => {
    frames.forEach((f) => {
      if (!f.outlink || !f.outlink.includes('/effect/exceptional/')) {
        f.hasImg = Boolean(f.outlink);
        return;
      }
      const tail = f.outlink.split('/effect/exceptional/')[1] || '';
      const file = `exceptional_${tail.replace(/\//g, '_')}.png`;
      f.localFile = file;
      f.hasImg = localFileExists(file) || Boolean(f.outlink);
    });
  });
  return spec;
}

function parseLayout(layoutXml) {
  const pickVec = (name, fallback) => {
    const m = layoutXml.match(new RegExp(`<vector name="${name}" value="([^"]+)"`));
    return m ? parseVector(m[1]) : fallback;
  };
  const itemScaleM = layoutXml.match(/<int32 name="itemIconScale" value="(\d+)"/);
  return {
    itemIcon: pickVec('vector:itemIcon', { x: 166, y: 112 }),
    itemName: pickVec('vector:itemName', { x: 200, y: 155 }),
    summaryBefore: pickVec('vector:summaryBefore', { x: 151, y: 306 }),
    summaryAfter: pickVec('vector:summaryAfter', { x: 256, y: 306 }),
    textScreenOffset: pickVec('vector:textScreenOffset', { x: 214, y: 115 }),
    effectAnchor: { x: 209, y: 114 },
    itemIconScale: itemScaleM ? parseInt(itemScaleM[1], 10) : 2,
  };
}

function main() {
  const xml = fs.readFileSync(XML, 'utf8');
  const effectBlock = extractEffectExceptionalBlock(xml);
  const layoutXml = extractLayoutBlock(xml);

  const enchantBlock = extractNamedDir(effectBlock, 'enchant');
  const extractBlock = extractNamedDir(effectBlock, 'extract');
  if (!enchantBlock) throw new Error('missing enchant block');

  const enchant = { try: {} };
  const tryBlock = extractNamedDir(enchantBlock, 'try');
  if (tryBlock) {
    for (const variant of ['0', '1']) {
      const inner = extractNamedDir(tryBlock, variant);
      if (!inner) continue;
      enchant.try[variant] = annotateFrames(parsePhaseBlock(inner));
    }
  }

  for (const phase of ['success', 'fail']) {
    const inner = extractNamedDir(enchantBlock, phase);
    if (!inner) continue;
    enchant[phase] = annotateFrames(parsePhaseBlock(inner));
  }

  const extract = {};
  if (extractBlock) {
    const inner = extractNamedDir(extractBlock, 'normal');
    if (inner) extract.normal = annotateFrames(parsePhaseBlock(inner));
  }

  const data = {
    frameDelayMs: 60,
    assetBase: 'images/exceptional/effect',
    filePrefix: 'exceptional',
    uiBase: 'images/exceptional',
    layout: parseLayout(layoutXml),
    enchant,
    extract,
  };

  const js = `/** 自動生成：卓越強化動畫（scripts/extract-exceptional-effect-frames.mjs） */
const EXCEPTIONAL_EFFECT = ${JSON.stringify(data, null, 2)};

function exceptionalEffectAssetPath(branch, phase, layer, frameIndex, tryVariant) {
  const base = EXCEPTIONAL_EFFECT.assetBase;
  const layerUnderscore = String(layer).replace(/\\//g, '_');

  if (branch === 'enchant' && phase === 'try') {
    const v = tryVariant === '1' ? '1' : '0';
    return \`\${base}/exceptional_enchant_try_\${v}_\${layerUnderscore}_\${frameIndex}.png\`;
  }

  if (branch === 'enchant' && phase === 'success') {
    return \`\${base}/exceptional_enchant_success_\${layerUnderscore}_\${frameIndex}.png\`;
  }

  if (branch === 'extract' && phase === 'normal') {
    return \`\${base}/exceptional_extract_normal_\${layerUnderscore}_\${frameIndex}.png\`;
  }

  return \`\${base}/exceptional_\${branch}_\${phase}_\${layerUnderscore}_\${frameIndex}.png\`;
}
`;

  fs.writeFileSync(OUT_JS, js, 'utf8');
  console.log('wrote', OUT_JS);
  console.log('enchant try variants', Object.keys(enchant.try || {}));
  console.log('enchant phases', Object.keys(enchant).filter((k) => k !== 'try'));
  console.log('extract phases', Object.keys(extract));
}

main();
