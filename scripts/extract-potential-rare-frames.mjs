/**
 * 從 UI.Enchant.img.xml 提取 rare 潛能動畫帧 origin，輸出 js/potentialEffectRare.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT = path.join(ROOT, 'js', 'potentialEffectRare.js');

function parseVector(str) {
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractRankBlock(xml, rank) {
  const needle = `effect/potential/${rank}/try/itemIcon/front/0`;
  const hit = xml.indexOf(needle);
  if (hit === -1) throw new Error(`missing effect/potential/${rank} block`);
  // walk back to <dir name="rare">
  const rareStart = xml.lastIndexOf(`<dir name="${rank}">`, hit);
  const epicStart = xml.indexOf(`<dir name="epic">`, hit);
  return xml.slice(rareStart, epicStart);
}

function parsePhase(block, phase) {
  const phaseStart = block.indexOf(`<dir name="${phase}">`);
  if (phaseStart === -1) return null;

  const result = { anchor: { x: 209, y: 114 }, layers: {} };

  const parseItemIcon = (html, prefix) => {
    const anchorM = html.match(/<dir name="itemIcon">[\s\S]*?<vector name="origin" value="([^"]+)"/);
    if (anchorM) result.anchor = parseVector(anchorM[1]);

    for (const layer of ['back', 'front']) {
      const layerRe = new RegExp(`<dir name="${layer}">([\\s\\S]*?)<\\/dir>`, 'g');
      const layerMatch = html.match(new RegExp(`<dir name="${layer}">([\\s\\S]*?)<\\/dir>\\s*(?:<dir name="|$)`));
      if (!layerMatch) continue;
      const frames = [];
      const pngRe = /<png name="(\d+)"[^>]*>([\s\S]*?)<\/png>/g;
      let m;
      while ((m = pngRe.exec(layerMatch[1])) !== null) {
        const inner = m[2];
        const originM = inner.match(/<vector name="origin" value="([^"]+)"/);
        const delayM = inner.match(/<int32 name="delay" value="(\d+)"/);
        const linkM = inner.match(/<string name="_outlink" value="([^"]+)"/);
        frames.push({
          i: parseInt(m[1], 10),
          o: originM ? parseVector(originM[1]) : null,
          d: delayM ? parseInt(delayM[1], 10) : 60,
          hasImg: Boolean(linkM),
        });
      }
      frames.sort((a, b) => a.i - b.i);
      if (frames.length) result.layers[`itemIcon/${layer}`] = frames;
    }

    const textMatch = html.match(/<dir name="textScreen">([\s\S]*?)<\/dir>/);
    if (textMatch) {
      const frames = [];
      const pngRe = /<png name="(\d+)"[^>]*>([\s\S]*?)<\/png>/g;
      let m;
      while ((m = pngRe.exec(textMatch[1])) !== null) {
        const inner = m[2];
        const originM = inner.match(/<vector name="origin" value="([^"]+)"/);
        const delayM = inner.match(/<int32 name="delay" value="(\d+)"/);
        frames.push({
          i: parseInt(m[1], 10),
          o: originM ? parseVector(originM[1]) : null,
          d: delayM ? parseInt(delayM[1], 10) : 60,
        });
      }
      frames.sort((a, b) => a.i - b.i);
      if (frames.length) result.layers.textScreen = frames;
    }
  };

  if (phase === 'try') {
    const m = block.match(/<dir name="try">([\s\S]*?)<\/dir>\s*<dir name="success">/);
    if (m) parseItemIcon(m[1], 'try');
    return result;
  }

  const successStart = block.indexOf('<dir name="success">');
  if (successStart === -1) return result;

  const successContent = block.slice(successStart);
  const variants = {};
  const varDirRe = /<dir name="(\d+)">/g;
  const indices = [];
  let im;
  while ((im = varDirRe.exec(successContent)) !== null) {
    const n = parseInt(im[1], 10);
    if (n < 10) indices.push(n);
  }

  for (const idx of indices) {
    const re = new RegExp(`<dir name="${idx}">([\\s\\S]*?)(?=\\n          <dir name="\\d+">|\\n        </dir>\\n      </dir>|$)`);
    const match = successContent.match(re);
    if (!match) continue;
    const v = { anchor: { x: 209, y: 114 }, layers: {} };
    const saved = { ...result, layers: { ...result.layers } };
    Object.assign(result, v);
    result.layers = {};
    parseItemIcon(match[1], `success/${idx}`);
    variants[idx] = { anchor: result.anchor, layers: { ...result.layers } };
    Object.assign(result, saved);
  }
  return variants;
}

const xml = fs.readFileSync(XML, 'utf8');
const block = extractRankBlock(xml, 'rare');
const data = {
  rank: 'rare',
  frameDelayMs: 60,
  assetBase: 'images/potential/rare',
  assetName: (phase, variant, layer, frame) => {
    if (phase === 'try') {
      const part = layer.replace('itemIcon/', '');
      return `potential.rare.try.itemIcon.${part}.${frame}`;
    }
    const part = layer === 'textScreen' ? 'textScreen' : layer.replace('itemIcon/', 'itemIcon.');
    return `potential.rare.success.${variant}.${part}.${frame}`;
  },
  try: parsePhase(block, 'try'),
  success: parsePhase(block, 'success'),
};

const js = `/** 自動生成：rare 潛能強化動畫帧資料（勿手改，用 scripts/extract-potential-rare-frames.mjs） */
const POTENTIAL_EFFECT_RARE = ${JSON.stringify(data, null, 2)};

function potentialEffectRareAssetPath(phase, variant, layer, frameIndex) {
  const base = POTENTIAL_EFFECT_RARE.assetBase;
  const layerDir = layer.replace('itemIcon/', 'itemIcon/');
  if (phase === 'try') {
    const part = layer.replace('itemIcon/', '');
    return \`\${base}/try/itemIcon/\${part}/potential.rare.try.itemIcon.\${part}.\${frameIndex}.png\`;
  }
  const part = layer === 'textScreen' ? 'textScreen' : \`itemIcon/\${layer.replace('itemIcon/', '')}\`;
  return \`\${base}/success/\${variant}/\${part}/potential.rare.success.\${variant}.\${layer === 'textScreen' ? 'textScreen' : 'itemIcon.' + layer.replace('itemIcon/', '')}.\${frameIndex}.png\`;
}
`;

fs.writeFileSync(OUT, js, 'utf8');
console.log('Wrote', OUT);
