/**
 * 從 UI.Enchant.img.xml 解析潛在能力強化 UI 與動畫 manifest
 *
 * 用法:
 *   node scripts/parse-potential-enchant.mjs [xmlPath] [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEFAULT_XML = path.join(ROOT, '..', 'UI.Enchant.img.xml');
const OUT_JSON = path.join(ROOT, 'data', 'potential-enchant-manifest.json');

const RANKS = ['rare', 'epic', 'unique', 'legendary'];

function parseVector(str) {
  if (!str) return null;
  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));
  return { x, y };
}

function extractSection(xml, startMarker, endMarker) {
  const start = xml.indexOf(startMarker);
  if (start === -1) return '';
  const end = endMarker ? xml.indexOf(endMarker, start + startMarker.length) : xml.length;
  return end === -1 ? xml.slice(start) : xml.slice(start, end);
}

function parseLayoutVectors(section) {
  const layout = {};
  const vecRe = /<vector name="([^"]+)" value="([^"]+)"\s*\/>/g;
  let m;
  while ((m = vecRe.exec(section)) !== null) {
    layout[m[1]] = parseVector(m[2]);
  }
  const intRe = /<int32 name="([^"]+)" value="(\d+)"\s*\/>/g;
  while ((m = intRe.exec(section)) !== null) {
    if (m[1] === 'itemIconScale') layout.itemIconScale = parseInt(m[2], 10);
  }
  return layout;
}

function parseTierUpgrade(section) {
  const tierUpgrade = {};
  for (const rank of RANKS) {
    const rankBlock = extractSection(
      section,
      `<dir name="${rank}">`,
      '</dir>\n      <dir name='
    );
    if (!rankBlock) continue;
    const frames = [];
    const pngRe = /<png name="(\d+)"[^>]*>[\s\S]*?<vector name="origin" value="([^"]+)"[\s\S]*?<string name="_outlink" value="([^"]+)"[\s\S]*?<\/png>/g;
    let m;
    while ((m = pngRe.exec(rankBlock)) !== null) {
      frames.push({
        threshold: parseInt(m[1], 10),
        origin: parseVector(m[2]),
        outlink: m[3],
      });
    }
    if (frames.length) tierUpgrade[rank] = frames;
  }
  return tierUpgrade;
}

function parseEffectPotential(xml) {
  const effectSection = extractSection(
    xml,
    '<dir name="potential">',
    '\n    </dir>\n  </dir>\n</imgdir>'
  );

  const effects = {};
  const outlinkRe = /effect\/potential\/([^/]+)\/(try|success|fail)(?:\/(\d+))?\/([^/]+)(?:\/([^/]+))?(?:\/(\d+))?/g;

  for (const rank of RANKS) {
    effects[rank] = { try: {}, success: {}, fail: {} };
  }

  // Parse frame blocks with origin + delay + outlink
  const frameBlockRe =
    /<png name="(\d+)"[^>]*>([\s\S]*?)<\/png>/g;
  let block;
  let currentPath = [];

  // Simpler: scan all outlinks under effect/potential
  const fullEffectRe =
    /UI\/_Canvas\/Enchant\.img\/effect\/potential\/([^"]+)"/g;
  const paths = new Set();
  let om;
  while ((om = fullEffectRe.exec(xml)) !== null) {
    paths.add(om[1]);
  }

  for (const p of paths) {
    const parts = p.split('/');
    const [rank, phase, ...rest] = parts;
    if (!RANKS.includes(rank) || !['try', 'success', 'fail'].includes(phase)) continue;

    let variant = null;
    let layerPath = rest;
    if (phase === 'success' || phase === 'fail') {
      if (/^\d+$/.test(rest[0])) {
        variant = parseInt(rest[0], 10);
        layerPath = rest.slice(1);
      }
    }

    const key = layerPath.join('/');
    const bucket =
      phase === 'try'
        ? effects[rank].try
        : phase === 'success'
          ? (effects[rank].success[variant ?? 0] ??= {})
          : (effects[rank].fail[variant ?? 0] ??= {});

    if (!bucket[key]) bucket[key] = { frames: [] };
    const frameIdx = parseInt(layerPath[layerPath.length - 1], 10);
    if (!Number.isNaN(frameIdx)) {
      if (!bucket[key].frames.includes(frameIdx)) bucket[key].frames.push(frameIdx);
    }
  }

  // Normalize success/fail variant structure + frame details from XML chunk per rank
  for (const rank of RANKS) {
    const rankStart = effectSection.indexOf(`<dir name="${rank}">`);
    if (rankStart === -1) continue;
    const rankEnd = effectSection.indexOf(`<dir name="`, rankStart + 20);
    const rankBlock = rankEnd === -1 ? effectSection.slice(rankStart) : effectSection.slice(rankStart, rankEnd);

    // itemIcon anchor
    const anchorMatch = rankBlock.match(
      /<dir name="(?:try|success|fail)">[\s\S]*?<dir name="itemIcon">[\s\S]*?<vector name="origin" value="([^"]+)"/
    );
    if (anchorMatch) effects[rank].itemIconAnchor = parseVector(anchorMatch[1]);

    for (const phase of ['try', 'success', 'fail']) {
      const phaseRe = new RegExp(`<dir name="${phase}">([\\s\\S]*?)(?=<dir name="(?:try|success|fail|${RANKS.join('|')})">|<\\/dir>\\s*<\\/dir>\\s*$)`, 'm');
      const phaseMatch = rankBlock.match(new RegExp(`<dir name="${phase}">([\\s\\S]*)`));
      if (!phaseMatch) {
        if (phase === 'fail') delete effects[rank].fail;
        continue;
      }

      const parseFrames = (html) => {
        const layers = {};
        const layerRe = /<dir name="([^"]+)">([\s\S]*?)<\/dir>/g;
        // Walk nested dirs for itemIcon/front etc.
        const walk = (content, prefix = '') => {
          const dirRe = /<dir name="([^"]+)">([\s\S]*?)<\/dir>/g;
          let dm;
          while ((dm = dirRe.exec(content)) !== null) {
            const name = prefix ? `${prefix}/${dm[1]}` : dm[1];
            if (dm[2].includes('<png name=')) {
              const frames = [];
              const pngRe = /<png name="(\d+)"[^>]*>([\s\S]*?)<\/png>/g;
              let pm;
              while ((pm = pngRe.exec(dm[2])) !== null) {
                const inner = pm[2];
                const originM = inner.match(/<vector name="origin" value="([^"]+)"/);
                const delayM = inner.match(/<int32 name="delay" value="(\d+)"/);
                const zM = inner.match(/<int32 name="z" value="(\d+)"/);
                const linkM = inner.match(/<string name="_outlink" value="([^"]+)"/);
                frames.push({
                  index: parseInt(pm[1], 10),
                  origin: originM ? parseVector(originM[1]) : null,
                  delay: delayM ? parseInt(delayM[1], 10) : 60,
                  z: zM ? parseInt(zM[1], 10) : 0,
                  outlink: linkM ? linkM[1] : null,
                });
              }
              frames.sort((a, b) => a.index - b.index);
              if (frames.length) layers[name] = frames;
            } else {
              walk(dm[2], name);
            }
          }
        };
        walk(html);
        return layers;
      };

      if (phase === 'try') {
        const tryMatch = rankBlock.match(/<dir name="try">([\s\S]*?)<\/dir>\s*<dir name="success">/);
        if (tryMatch) effects[rank].try = parseFrames(tryMatch[1]);
      } else {
        const variantRe = new RegExp(`<dir name="${phase}">([\\s\\S]*?)(?=<dir name="(?:${RANKS.join('|')})">|$)`, 'm');
        const wholePhase = rankBlock.match(new RegExp(`<dir name="${phase}">([\\s\\S]*)`));
        if (!wholePhase) continue;

        const variantDirRe = /<dir name="(\d+)">([\s\S]*?)<\/dir>/g;
        const variants = {};
        let vm;
        const phaseContent = wholePhase[1];
        while ((vm = variantDirRe.exec(phaseContent)) !== null) {
          variants[parseInt(vm[1], 10)] = parseFrames(vm[2]);
        }
        if (Object.keys(variants).length) {
          effects[rank][phase] = variants;
        } else if (phase === 'fail') {
          delete effects[rank].fail;
        }
      }
    }
  }

  return effects;
}

function summarizeEffects(effects) {
  const summary = {};
  for (const rank of RANKS) {
    const e = effects[rank];
    summary[rank] = {
      itemIconAnchor: e.itemIconAnchor,
      try: Object.fromEntries(
        Object.entries(e.try || {}).map(([k, frames]) => [k, { frameCount: frames.length, delay: frames[0]?.delay ?? 60 }])
      ),
      success: Object.fromEntries(
        Object.entries(e.success || {}).map(([v, layers]) => [
          v,
          Object.fromEntries(
            Object.entries(layers).map(([k, frames]) => [k, { frameCount: frames.length, delay: frames[0]?.delay ?? 60 }])
          ),
        ])
      ),
    };
    if (e.fail) {
      summary[rank].fail = Object.fromEntries(
        Object.entries(e.fail).map(([v, layers]) => [
          v,
          Object.fromEntries(
            Object.entries(layers).map(([k, frames]) => [k, { frameCount: frames.length }])
          ),
        ])
      );
    }
  }
  return summary;
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const xmlPath = args.find((a) => !a.startsWith('-')) || DEFAULT_XML;

  if (!fs.existsSync(xmlPath)) {
    console.error(`找不到 XML: ${xmlPath}`);
    process.exit(1);
  }

  console.log(`讀取 ${xmlPath} ...`);
  const xml = fs.readFileSync(xmlPath, 'utf8');

  const potentialSection = extractSection(
    xml,
    '<dir name="potential">',
    '\n  <dir name="bonusStat">'
  );

  const layout = parseLayoutVectors(potentialSection);
  const tierUpgrade = parseTierUpgrade(
    extractSection(potentialSection, '<dir name="tierUpgrade">', '</dir>\n    <png name="layer:costMeso100"')
  );

  const effects = parseEffectPotential(xml);
  const summary = summarizeEffects(effects);

  const manifest = {
    source: path.basename(xmlPath),
    layout: {
      itemIcon: layout['vector:itemIcon'],
      itemIconScale: layout.itemIconScale ?? 2,
      itemName: layout['vector:itemName'],
      textScreenOffset: layout['vector:textScreenOffset'],
      statL: layout['vector:statL'],
      atkPow: layout['vector:atkPow'],
      ceiling: layout['vector:ceiling'],
      mesoConfirm100: layout['vector:mesoConfirm100'],
      wz2Prob: layout['vector:wz2Prob'],
      itemLT: layout['vector:itemLT'],
      itemRB: layout['vector:itemRB'],
    },
    tierUpgrade,
    effects,
    summary,
    assetBase: 'images/potential/effect',
    outlinkPrefix: 'UI/_Canvas/Enchant.img/',
  };

  console.log('\n=== 布局關鍵座標 ===');
  console.log(JSON.stringify(manifest.layout, null, 2));

  console.log('\n=== tierUpgrade 機率閃光 ===');
  for (const [rank, frames] of Object.entries(tierUpgrade)) {
    console.log(`  ${rank}: ${frames.map((f) => f.threshold + '%').join(', ')}`);
  }

  console.log('\n=== effect/potential 動畫摘要 ===');
  console.log(JSON.stringify(summary, null, 2));

  const totalOutlinks = (xml.match(/effect\/potential\//g) || []).length;
  console.log(`\n共 ${totalOutlinks} 個 effect/potential 素材引用`);

  if (write) {
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n已寫入 ${OUT_JSON}`);
  } else {
    console.log(`\n加 --write 可輸出完整 manifest 至 data/potential-enchant-manifest.json`);
  }
}

main();
