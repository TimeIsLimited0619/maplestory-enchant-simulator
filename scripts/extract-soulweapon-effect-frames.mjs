/**
 * 從 UI.Enchant.img.xml 提取靈魂武器動畫（enchanter / soul）
 * 用法: node scripts/extract-soulweapon-effect-frames.mjs [xmlPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT_JS = path.join(ROOT, 'js', 'soulWeaponEffectData.js');
const EFFECT_DIR = path.join(ROOT, 'images', 'SoulWeapon', 'effect');

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractEffectSoulWeaponBlock(xml) {
  const hit = xml.indexOf('effect/soulWeapon/');
  if (hit === -1) throw new Error('missing effect/soulWeapon block');
  const start = xml.lastIndexOf('<dir name="soulWeapon">', hit);
  if (start === -1) throw new Error('cannot find effect soulWeapon dir');

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
  throw new Error('unclosed effect soulWeapon block');
}

function extractLayoutBlock(xml) {
  const hit = xml.indexOf('Enchant.img/soulWeapon/backgrnd');
  if (hit === -1) throw new Error('missing soulWeapon layout');
  const start = xml.lastIndexOf('<dir name="soulWeapon">', hit);
  const end = xml.indexOf('\n  <dir name="traceTransfer">', start);
  if (start === -1 || end === -1) throw new Error('cannot slice soulWeapon layout');
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

function localSoulFileExists(relName) {
  return fs.existsSync(path.join(EFFECT_DIR, relName));
}

function annotateLocalAvailability(spec, kind, phase) {
  if (!spec?.layers) return spec;
  for (const [layerKey, frames] of Object.entries(spec.layers)) {
    frames.forEach((f) => {
      if (!f.outlink) {
        f.hasImg = false;
        return;
      }
      // Mark local soulWeapon unique frames when file exists
      if (f.outlink.includes('/effect/soulWeapon/')) {
        const parts = layerKey.split('/');
        const file =
          kind === 'enchanter'
            ? `soulWeapon_enchanter_${phase}_${parts.join('_')}_${f.i}.png`
            : `soulWeapon_soul_${phase}_${parts.join('_')}_${f.i}.png`;
        f.localFile = file;
        f.hasImg = localSoulFileExists(file) || Boolean(f.outlink);
      } else {
        f.hasImg = true;
      }
    });
  }
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
    summary: pickVec('vector:summary', { x: 209, y: 259 }),
    textScreenOffset: pickVec('vector:textScreenOffset', { x: 214, y: 115 }),
    effectAnchor: { x: 209, y: 114 },
    itemIconScale: itemScaleM ? parseInt(itemScaleM[1], 10) : 2,
    detailLT: pickVec('vector:detailLT', { x: 10, y: 282 }),
    detailRB: pickVec('vector:detailRB', { x: 408, y: 412 }),
    costInvenLT: pickVec('vector:costInvenLT', { x: 20, y: 444 }),
    costInvenRB: pickVec('vector:costInvenRB', { x: 400, y: 527 }),
    slotFirst: pickVec('vector:slotFirst', { x: 0, y: 2 }),
    slotSize: pickVec('vector:slotSize', { x: 38, y: 38 }),
    slotSpace: pickVec('vector:slotSpace', { x: 3, y: 3 }),
    slotCnt: pickVec('vector:slotCnt', { x: 9, y: 2 }),
  };
}

function main() {
  const xml = fs.readFileSync(XML, 'utf8');
  const effectBlock = extractEffectSoulWeaponBlock(xml);
  const layoutXml = extractLayoutBlock(xml);

  const enchanterBlock = extractNamedDir(effectBlock, 'enchanter');
  const soulBlock = extractNamedDir(effectBlock, 'soul');
  if (!enchanterBlock || !soulBlock) throw new Error('missing enchanter/soul');

  const enchanter = {};
  for (const phase of ['try', 'success', 'fail']) {
    const inner = extractNamedDir(enchanterBlock, phase);
    if (!inner) continue;
    enchanter[phase] = annotateLocalAvailability(parsePhaseBlock(inner), 'enchanter', phase);
  }

  const soul = {};
  for (const phase of ['normal', 'magnificent', 'fail']) {
    const inner = extractNamedDir(soulBlock, phase);
    if (!inner) continue;
    soul[phase] = annotateLocalAvailability(parsePhaseBlock(inner), 'soul', phase);
  }

  const data = {
    frameDelayMs: 60,
    assetBase: 'images/SoulWeapon/effect',
    filePrefix: 'soulWeapon',
    uiBase: 'images/SoulWeapon',
    layout: parseLayout(layoutXml),
    enchanter,
    soul,
  };

  const js = `/** 自動生成：靈魂武器動畫（scripts/extract-soulweapon-effect-frames.mjs） */
const SOUL_WEAPON_EFFECT = ${JSON.stringify(data, null, 2)};

/**
 * Resolve a frame asset URL（全部走本地 SoulWeapon/effect）。
 */
function soulWeaponEffectAssetPath(branch, phase, layer, frameIndex) {
  const base = SOUL_WEAPON_EFFECT.assetBase;
  const prefix = SOUL_WEAPON_EFFECT.filePrefix;
  const layerDot = layer.replace(/\\//g, '.');
  const layerUnderscore = layer.replace(/\\//g, '_');

  if (branch === 'enchanter' && phase === 'success') {
    return \`\${base}/\${prefix}.enchanter.success.\${layerDot}.\${frameIndex}.png\`;
  }

  if (branch === 'enchanter' && phase === 'try') {
    if (frameIndex >= 2 && frameIndex <= 9) {
      return \`\${base}/\${prefix}_enchanter_try_\${layerUnderscore}_\${frameIndex}.png\`;
    }
    return \`\${base}/\${prefix}.enchanter.try.\${layerDot}.\${frameIndex}.png\`;
  }

  if (
    branch === 'soul'
    && (phase === 'normal' || phase === 'magnificent')
    && layer === 'textScreen'
  ) {
    return \`\${base}/\${prefix}.enchanter.success.textScreen.\${frameIndex}.png\`;
  }

  if (branch === 'soul') {
    return \`\${base}/\${prefix}_soul_\${phase}_\${layerUnderscore}_\${frameIndex}.png\`;
  }

  return \`\${base}/\${prefix}.enchanter.\${phase}.\${layerDot}.\${frameIndex}.png\`;
}
`;

  fs.writeFileSync(OUT_JS, js, 'utf8');
  console.log('wrote', OUT_JS);
  console.log('enchanter phases', Object.keys(enchanter));
  console.log('soul phases', Object.keys(soul));
}

main();
