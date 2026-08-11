/**
 * 從 UI.Enchant.img.xml 提取 fullScreen_potential choiceBox flip / rankUp 動畫
 * 用法: node scripts/extract-fullscreen-potential-choice-effect-frames.mjs [xmlPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT_JS = path.join(ROOT, 'js', 'potentialMemoriaChoiceEffectData.js');

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractDirBlock(xml, dirName, fromIndex = 0) {
  const open = `<dir name="${dirName}">`;
  const start = xml.indexOf(open, fromIndex);
  if (start === -1) return null;

  let depth = 0;
  const dirRe = /<dir name="[^"]+">|<\/dir>/g;
  dirRe.lastIndex = start;
  let end = start;
  let m;
  while ((m = dirRe.exec(xml)) !== null) {
    if (m[0].startsWith('<dir')) depth += 1;
    else depth -= 1;
    if (depth === 0) {
      end = dirRe.lastIndex;
      break;
    }
  }
  return xml.slice(start, end);
}

function pngExists(baseParts) {
  return fs.existsSync(path.join(ROOT, ...baseParts));
}

function parsePngFrames(html, { rankName, layer, assetBase, phaseName }) {
  const frames = [];
  const pngRe = /<png name="(\d+)"[^>]*>([\s\S]*?)<\/png>/g;
  let m;
  while ((m = pngRe.exec(html)) !== null) {
    const inner = m[2];
    const frameIndex = parseInt(m[1], 10);
    const originM = inner.match(/<vector name="origin" value="([^"]+)"/);
    const delayM = inner.match(/<int32 name="delay" value="(\d+)"/);
    const linkM = inner.match(/<string name="_outlink" value="([^"]+)"/);
    const origin = originM ? parseVector(originM[1]) : null;
    let assetRank = rankName;
    if (linkM) {
      const linkRank = linkM[1].match(/rankUp\/(\w+)\/(front|back)/);
      if (linkRank) assetRank = linkRank[1];
    }
    const onDisk = phaseName
      ? pngExists(assetBase.replace(/\//g, path.sep).split(path.sep).filter(Boolean).concat(phaseName, layer, `${frameIndex}.png`))
      : pngExists(assetBase.replace(/\//g, path.sep).split(path.sep).filter(Boolean).concat(assetRank, layer, `${frameIndex}.png`));
    const useLoopFront = phaseName === 'appear'
      && layer === 'front'
      && frameIndex <= 5
      && (!linkM || (origin && origin.x < 0));
    frames.push({
      i: frameIndex,
      o: origin,
      d: delayM ? parseInt(delayM[1], 10) : 60,
      hasImg: useLoopFront ? false : (Boolean(linkM) || onDisk),
      ...(assetRank !== rankName ? { assetRank } : {}),
      ...(useLoopFront ? { useLoopFront: true } : {}),
    });
  }
  frames.sort((a, b) => a.i - b.i);
  return frames;
}

function parseFlipPhase(flipBlock, phaseName, assetBase) {
  const phaseBlock = extractDirBlock(flipBlock, phaseName);
  if (!phaseBlock) return null;

  const result = {};
  const boxTimingM = phaseBlock.match(/<int32 name="boxAppearTiming" value="(\d+)"/);
  if (boxTimingM) result.boxAppearTiming = parseInt(boxTimingM[1], 10);

  const ltM = phaseBlock.match(/<vector name="ltOffset" value="([^"]+)"/);
  if (ltM) result.ltOffset = parseVector(ltM[1]);

  for (const layer of ['front', 'back']) {
    const layerBlock = extractDirBlock(phaseBlock, layer);
    if (!layerBlock) continue;
    const frames = parsePngFrames(layerBlock, { rankName: phaseName, layer, assetBase, phaseName });
    if (frames.length) result[layer] = frames;
  }

  return Object.keys(result).length ? result : null;
}

function parseRankUpRank(rankBlock, rankName, assetBase) {
  if (!rankBlock) return null;
  const result = {};
  const boxTimingM = rankBlock.match(/<int32 name="boxAppearTiming" value="(\d+)"/);
  if (boxTimingM) result.boxAppearTiming = parseInt(boxTimingM[1], 10);

  for (const layer of ['front', 'back']) {
    const layerBlock = extractDirBlock(rankBlock, layer);
    if (!layerBlock) continue;
    const frames = parsePngFrames(layerBlock, { rankName, layer, assetBase, phaseName: null });
    if (frames.length) result[layer] = frames;
  }

  return Object.keys(result).length ? result : null;
}

function extractChoiceBoxMeta(xml) {
  const hit = xml.indexOf('<dir name="fullScreen_potential">');
  if (hit === -1) return {};
  const slice = xml.slice(hit, hit + 12000);
  const choiceHit = slice.indexOf('<dir name="choiceBox">');
  const choiceSlice = choiceHit === -1 ? slice : slice.slice(choiceHit, choiceHit + 8000);
  const appearDurationM = choiceSlice.match(/<int32 name="appearDuration" value="(\d+)"/);
  const appearStartAlphaM = choiceSlice.match(/<int32 name="appearStartAlpha" value="(\d+)"/);
  return {
    appearDuration: appearDurationM ? parseInt(appearDurationM[1], 10) : 1000,
    appearStartAlpha: appearStartAlphaM ? parseInt(appearStartAlphaM[1], 10) : 120,
  };
}

function main() {
  if (!fs.existsSync(XML)) {
    console.error('XML not found:', XML);
    process.exit(1);
  }

  const xml = fs.readFileSync(XML, 'utf8');
  const hit = xml.indexOf('fullScreen_potential/choiceBox/eff/flip/loop/front/0');
  if (hit === -1) throw new Error('missing fullScreen_potential choiceBox eff flip block');
  const fsPot = xml.lastIndexOf('<dir name="fullScreen_potential">', hit);
  const effBlock = extractDirBlock(xml, 'eff', xml.indexOf('<dir name="choiceBox">', fsPot));
  const flipBlock = effBlock ? extractDirBlock(effBlock, 'flip') : extractDirBlock(xml, 'flip', hit);
  const rankUpBlock = effBlock ? extractDirBlock(effBlock, 'rankUp') : null;
  if (!flipBlock) throw new Error('cannot slice choiceBox flip block');

  const meta = extractChoiceBoxMeta(xml);
  const assetBase = 'images/fullscreen_potential/choiceBox/eff/flip/';
  const rankUpAssetBase = 'images/fullscreen_potential/choiceBox/eff/rankUp/';
  const loop = parseFlipPhase(flipBlock, 'loop', assetBase);
  const appear = parseFlipPhase(flipBlock, 'appear', assetBase);
  if (appear && loop?.ltOffset && !appear.ltOffset) {
    appear.ltOffset = loop.ltOffset;
  }

  const rankUp = {};
  if (rankUpBlock) {
    for (const rank of ['epic', 'unique', 'legendary']) {
      const rankSpec = parseRankUpRank(extractDirBlock(rankUpBlock, rank), rank, rankUpAssetBase);
      if (rankSpec) rankUp[rank] = rankSpec;
    }
  }

  const data = {
    assetBase,
    rankUpAssetBase,
    frameDelayMs: 60,
    ...meta,
    // Web 版 AFTER 框即對應遊戲 choiceBox；flip ltOffset 僅保留在 flip.loop 供參考
    displayAnchor: { x: 0, y: 0 },
    flip: { appear, loop },
    rankUp,
  };

  const js = `/**
 * fullScreen_potential choiceBox flip / rankUp 動畫（由 scripts/extract-fullscreen-potential-choice-effect-frames.mjs 產生）
 */
const POTENTIAL_MEMORIA_CHOICE_EFFECT = ${JSON.stringify(data, null, 2)};

function ptMemoriaFlipAssetPath(phase, layer, frameIndex) {
  return \`\${POTENTIAL_MEMORIA_CHOICE_EFFECT.assetBase}\${phase}/\${layer}/\${frameIndex}.png\`;
}

function ptMemoriaRankUpAssetPath(rank, layer, frameIndex) {
  return \`\${POTENTIAL_MEMORIA_CHOICE_EFFECT.rankUpAssetBase}\${rank}/\${layer}/\${frameIndex}.png\`;
}
`;

  fs.writeFileSync(OUT_JS, js, 'utf8');
  console.log('Wrote', OUT_JS);
  console.log('appear front:', appear?.front?.length, 'back:', appear?.back?.length);
  console.log('loop front:', loop?.front?.length, 'back:', loop?.back?.length);
  console.log('rankUp ranks:', Object.keys(rankUp).join(', '));
}

main();
