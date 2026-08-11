/**
 * 從 UI.Enchant.img.xml 提取各階潛能動畫帧，輸出 js/potentialEffectData.js
 * 用法: node scripts/extract-potential-effect-frames.mjs [xmlPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT = path.join(ROOT, 'js', 'potentialEffectData.js');
const RANKS = ['rare', 'epic', 'unique', 'legendary'];

function parseVector(str) {
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractRankBlock(xml, rank) {
  const needle = `effect/potential/${rank}/try/itemIcon/front/0`;
  const hit = xml.indexOf(needle);
  if (hit === -1) throw new Error(`missing effect/potential/${rank} block`);
  const rankStart = xml.lastIndexOf(`<dir name="${rank}">`, hit);
  const rankIndex = RANKS.indexOf(rank);
  const nextRank = RANKS[rankIndex + 1];
  const rankEnd = nextRank
    ? xml.indexOf(`<dir name="${nextRank}">`, hit)
    : xml.indexOf('<dir name="addtionalPotential">', hit);
  if (rankStart === -1 || rankEnd === -1) throw new Error(`cannot slice block for ${rank}`);
  return xml.slice(rankStart, rankEnd);
}

function parseItemIconLayers(html, result) {
  const anchorM = html.match(/<dir name="itemIcon">[\s\S]*?<vector name="origin" value="([^"]+)"/);
  if (anchorM) result.anchor = parseVector(anchorM[1]);

  for (const layer of ['back', 'front']) {
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
}

function parseTry(block) {
  const result = { anchor: { x: 209, y: 114 }, layers: {} };
  const m = block.match(/<dir name="try">([\s\S]*?)<\/dir>\s*<dir name="success">/);
  if (m) parseItemIconLayers(m[1], result);
  return result;
}

function parseSuccess(block, rank) {
  const successStart = block.indexOf('<dir name="success">');
  if (successStart === -1) return {};

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
    parseItemIconLayers(match[1], v);
    variants[idx] = v;
  }

  // 傳說僅 success/1；略過 success/0
  if (rank === 'legendary' && variants[0] && !variants[1]) {
    delete variants[0];
  }
  return variants;
}

const xml = fs.readFileSync(XML, 'utf8');
const byRank = {};

for (const rank of RANKS) {
  const block = extractRankBlock(xml, rank);
  const success = parseSuccess(block, rank);
  const successVariants = Object.keys(success)
    .map(Number)
    .filter((v) => v !== 0)
    .sort((a, b) => a - b);

  byRank[rank] = {
    rank,
    frameDelayMs: 60,
    assetBase: `images/potential/${rank}`,
    filePrefix: rank === 'rare' ? 'potential.rare' : `effect.potential.${rank}`,
    hasRankUpSuccess: rank !== 'legendary' && successVariants.includes(2),
    successVariants,
    try: parseTry(block),
    success,
  };
}

const js = `/** 自動生成：各階潛能強化動畫帧（scripts/extract-potential-effect-frames.mjs） */
const POTENTIAL_EFFECT_BY_RANK = ${JSON.stringify(byRank, null, 2)};

function potentialEffectAssetPath(rankId, phase, variant, layer, frameIndex) {
  const data = POTENTIAL_EFFECT_BY_RANK[rankId];
  if (!data) return '';
  const base = data.assetBase;
  const prefix = data.filePrefix;
  if (phase === 'try') {
    const part = layer.replace('itemIcon/', '');
    return \`\${base}/try/itemIcon/\${part}/\${prefix}.try.itemIcon.\${part}.\${frameIndex}.png\`;
  }
  const v = variant === 2 ? 2 : 1;
  const part = layer === 'textScreen' ? 'textScreen' : \`itemIcon/\${layer.replace('itemIcon/', '')}\`;
  const layerName = layer === 'textScreen' ? 'textScreen' : \`itemIcon.\${layer.replace('itemIcon/', '')}\`;
  return \`\${base}/success/\${v}/\${part}/\${prefix}.success.\${v}.\${layerName}.\${frameIndex}.png\`;
}
`;

fs.writeFileSync(OUT, js, 'utf8');
console.log('Wrote', OUT);
for (const rank of RANKS) {
  const d = byRank[rank];
  console.log(`  ${rank}: try front=${d.try.layers['itemIcon/front']?.length || 0}, success variants=[${d.successVariants.join(',')}]`);
}
