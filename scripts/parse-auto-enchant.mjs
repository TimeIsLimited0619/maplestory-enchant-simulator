/**

 * 從 UI.Enchant.img.xml 提取 Enchant.img/autoEnchant 版面與資源路徑

 * 用法: node scripts/parse-auto-enchant.mjs [xmlPath]

 */

import fs from 'fs';

import path from 'path';

import { fileURLToPath } from 'url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.join(__dirname, '..');

const XML = process.argv[2] || path.join(ROOT, '..', 'UI.Enchant.img.xml');

const OUT_JS = path.join(ROOT, 'js', 'autoEnchantData.js');

const OUT_JSON = path.join(ROOT, 'data', 'auto-enchant-summary.json');



function parseVector(str) {

  if (!str) return null;

  const [x, y] = str.split(',').map((s) => parseInt(s.trim(), 10));

  return { x, y };

}



function outlinkToLocal(outlink) {

  if (!outlink) return null;

  const m = outlink.match(/(?:UI\/_Canvas\/)?(?:UI\/)?Enchant\.img\/(.+)$/)

    || outlink.match(/(?:UI\/_Canvas\/)?(?:UI\/)?BattleSimulationReplay\.img\/(.+)$/);

  if (!m) return null;

  if (outlink.includes('BattleSimulationReplay.img')) {

    return outlink.includes('checked')

      ? 'images/starforce/starForce.button_protectDestroy.checkedAndDisabled.png'

      : 'images/starforce/starForce.button_protectDestroy.unchecked.png';

  }

  const pathTail = m[1];
  const potentialAlert = pathTail.match(/^fullScreen_potential\/progressAlert\/(\d+)$/);
  if (potentialAlert) {
    return `images/autoEnchant/fullScreen_potential.progressAlert.${potentialAlert[1]}.png`;
  }

  const addPotentialAlert = pathTail.match(/^fullScreen_additionalPotential\/progressAlert\/(\d+)$/);
  if (addPotentialAlert) {
    return `images/autoEnchant/fullScreen_potential.progressAlert.${addPotentialAlert[1]}.png`;
  }

  const tail = pathTail.replace(/^autoEnchant\//, '').replace(/[/:]/g, '_');

  return `images/autoEnchant/autoEnchant_${tail}.png`;

}



function extractAutoEnchantSection(xml, sectionName) {

  const rootHit = xml.indexOf('<dir name="autoEnchant">');

  if (rootHit === -1) return null;

  const sectionHit = xml.indexOf(`<dir name="${sectionName}">`, rootHit);

  if (sectionHit === -1) return null;



  let depth = 0;

  let i = sectionHit;

  while (i < xml.length) {

    const open = xml.indexOf('<dir ', i);

    const close = xml.indexOf('</dir>', i);

    if (close === -1) break;

    if (open !== -1 && open < close) {

      depth += 1;

      i = open + 4;

    } else {

      depth -= 1;

      i = close + 6;

      if (depth === 0) return xml.slice(sectionHit, i);

    }

  }

  return null;

}



function parseButtonStates(block, buttonName) {

  const re = new RegExp(`<dir name="${buttonName.replace(/:/g, '\\:')}">([\\s\\S]*?)<\\/dir>\\s*(?:<dir name=|<vector name=|<int32 name=|<string name=ToolTip|<png name=|<\\/dir>)`);

  const m = block.match(re);

  if (!m) return null;



  const inner = m[1];

  const states = {};

  for (const state of ['normal', 'pressed', 'disabled', 'mouseOver']) {

    const sm = inner.match(new RegExp(`<dir name="${state}">[\\s\\S]*?<vector name="origin" value="([^"]+)"`));

    const om = inner.match(new RegExp(`<dir name="${state}">[\\s\\S]*?<string name="_outlink" value="([^"]+)"`));

    if (sm || om) {

      states[state] = {

        origin: sm ? parseVector(sm[1]) : null,

        src: om ? outlinkToLocal(om[1]) : null,

      };

    }

  }

  const idM = inner.match(/<int32 name="id" value="(\d+)"/);

  const tipM = inner.match(/<string name="ToolTip" value="([^"]*)"/);

  const tipDisM = inner.match(/<string name="ToolTip_Disabled" value="([^"]*)"/);

  return {

    id: idM ? Number(idM[1]) : null,

    toolTip: tipM?.[1] || null,

    toolTipDisabled: tipDisM?.[1] || null,

    states,

  };

}



function parseProtectButton(block, name) {

  const re = new RegExp(`<dir name="${name}">([\\s\\S]*?)<\\/dir>\\s*<dir name="button_protectDestroy`);

  const m = block.match(re) || block.match(new RegExp(`<dir name="${name}">([\\s\\S]*?)<\\/dir>\\s*<vector name="vector:subWndMargin"`));

  if (!m) return null;

  const inner = m[1];

  const idM = inner.match(/<int32 name="id" value="(\d+)"/);

  const btnM = inner.match(/<dir name="button">[\s\S]*?<dir name="normal">[\s\S]*?<string name="_outlink" value="([^"]+)"/);

  return {

    id: idM ? Number(idM[1]) : null,

    labelSrc: btnM ? outlinkToLocal(btnM[1]) : null,

  };

}



function parseProgressAlert(block) {

  const progress = [];

  const progRe = /<png name="(\d+)"[\s\S]*?<int32 name="delay" value="(\d+)"[\s\S]*?<string name="_outlink" value="([^"]+)"/g;

  let pm;

  while ((pm = progRe.exec(block)) !== null) {

    progress.push({

      i: Number(pm[1]),

      delay: Number(pm[2]),

      src: outlinkToLocal(pm[3]),

    });

  }

  progress.sort((a, b) => a.i - b.i);

  return progress;

}



function parseComboBox(block, comboName) {

  const re = new RegExp(`<dir name="${comboName.replace(/:/g, '\\:')}">([\\s\\S]*?)<\\/dir>\\s*(?:<dir name="combo:|<dir name="button:|<png name="layer:title)`);

  const m = block.match(re);

  if (!m) return null;

  const inner = m[1];

  const ltM = inner.match(/<vector name="lt" value="([^"]+)"/);

  const rbM = inner.match(/<vector name="rb" value="([^"]+)"/);

  const idM = inner.match(/<int32 name="id" value="(\d+)"/);

  return {

    id: idM ? Number(idM[1]) : null,

    lt: ltM ? parseVector(ltM[1]) : null,

    rb: rbM ? parseVector(rbM[1]) : null,

  };

}



function parseLayerPng(block, layerName) {

  const re = new RegExp(`<png name="${layerName.replace(/:/g, '\\:')}"[\\s\\S]*?<vector name="origin" value="([^"]+)"[\\s\\S]*?<string name="_outlink" value="([^"]+)"`);

  const m = block.match(re);

  if (!m) return null;

  return {

    origin: parseVector(m[1]),

    src: outlinkToLocal(m[2]),

  };

}



function parseStopAttackPower(block, nextSectionName = 'additionalPotential') {
  const section = block.match(new RegExp(`<dir name="button_stopAttackPower">([\\s\\S]*?)<\\/dir>\\s*<\\/dir>\\s*<dir name="${nextSectionName}">`))
    || block.match(/<dir name="button_stopAttackPower">([\s\S]*?)<\/dir>\s*<\/dir>\s*$/);

  if (!section) return null;

  const inner = section[1];

  const btn = parseButtonStates(inner, 'button');

  const checkedM = inner.match(/<png name="checked"[\s\S]*?<string name="_outlink" value="([^"]+)"/);

  const uncheckedM = inner.match(/<png name="unchecked"[\s\S]*?<string name="_outlink" value="([^"]+)"/);

  return {

    id: btn?.id || null,

    labelSrc: btn?.states?.normal?.src || null,

    checkedSrc: checkedM ? outlinkToLocal(checkedM[1]) : null,

    uncheckedSrc: uncheckedM ? outlinkToLocal(uncheckedM[1]) : null,

  };

}



function parseStarForceBlock(block) {

  const vec = (name) => {

    const m = block.match(new RegExp(`<vector name="${name}" value="([^"]+)"`));

    return m ? parseVector(m[1]) : null;

  };



  const editM = block.match(/<dir name="edit:diffAfter">([\s\S]*?)<\/dir>/);

  let targetEdit = null;

  if (editM) {

    const e = editM[1];

    const ltM = e.match(/<vector name="lt" value="([^"]+)"/);

    const rbM = e.match(/<vector name="rb" value="([^"]+)"/);

    const maxM = e.match(/<int32 name="maxlen" value="(\d+)"/);

    targetEdit = {

      lt: ltM ? parseVector(ltM[1]) : null,

      rb: rbM ? parseVector(rbM[1]) : null,

      maxLen: maxM ? Number(maxM[1]) : 2,

    };

  }



  const fontM = block.match(/<dir name="font:diffBefore">([\s\S]*?)<\/dir>/);

  let diffBeforeFont = null;

  if (fontM) {

    const f = fontM[1];

    diffBeforeFont = {

      font: f.match(/<string name="font" value="([^"]+)"/)?.[1] || null,

      color: f.match(/<string name="fontColor" value="([^"]+)"/)?.[1] || null,

      size: Number(f.match(/<int32 name="fontSize" value="(\d+)"/)?.[1] || 12),

      bold: Number(f.match(/<int32 name="fontBold" value="(\d+)"/)?.[1] || 0) === 1,

    };

  }



  const bgM = block.match(/<png name="backgrnd"[\s\S]*?<string name="_outlink" value="([^"]+)"/);



  return {

    backgrnd: bgM ? outlinkToLocal(bgM[1]) : null,

    diffBefore: vec('vector:diffBefore'),

    progressAlertOffset: vec('vector:progressAlertOffset'),

    subWndMargin: vec('vector:subWndMargin'),

    diffBeforeFont,

    targetEdit,

    buttons: {

      ok: parseButtonStates(block, 'button:OK'),

      cancel: parseButtonStates(block, 'button:Cancel'),

      up: parseButtonStates(block, 'button:UP'),

      down: parseButtonStates(block, 'button:Down'),

      all: parseButtonStates(block, 'button:All'),

    },

    protectDestroy: {

      15: parseProtectButton(block, 'button_protectDestroy15'),

      16: parseProtectButton(block, 'button_protectDestroy16'),

      17: parseProtectButton(block, 'button_protectDestroy17'),

    },

    progressAlert: parseProgressAlert(block),

  };

}



function parsePotentialBlock(block, stopAttackNextSection = 'additionalPotential') {

  const vec = (name) => {

    const m = block.match(new RegExp(`<vector name="${name}" value="([^"]+)"`));

    return m ? parseVector(m[1]) : null;

  };



  const bgM = block.match(/<png name="backgrnd"[\s\S]*?<string name="_outlink" value="([^"]+)"/);

  const viewM = block.match(/<dir name="potentialView">([\s\S]*?)<\/dir>\s*<dir name="button:OK">/);

  const viewBlock = viewM ? viewM[1] : '';

  const viewBgM = viewBlock.match(/<png name="backgrnd"[\s\S]*?<string name="_outlink" value="([^"]+)"/);



  return {

    backgrnd: bgM ? outlinkToLocal(bgM[1]) : null,

    sectionLT: vec('vector:sectionLT'),

    sectionRB: vec('vector:sectionRB'),

    progressAlertOffset: vec('vector:progressAlertOffset'),

    subWndMargin: vec('vector:subWndMargin'),

    potentialView: {

      backgrnd: viewBgM ? outlinkToLocal(viewBgM[1]) : null,

      combos: {

        opt1: parseComboBox(viewBlock, 'combo:opt1'),

        opt2: parseComboBox(viewBlock, 'combo:opt2'),

        opt3: parseComboBox(viewBlock, 'combo:opt3'),

      },

      reset: parseButtonStates(viewBlock, 'button:reset'),

      titles: {

        title1: parseLayerPng(viewBlock, 'layer:title1'),

        title2: parseLayerPng(viewBlock, 'layer:title2'),

        title3: parseLayerPng(viewBlock, 'layer:title3'),

        title4: parseLayerPng(viewBlock, 'layer:title4'),

      },

    },

    buttons: {

      ok: parseButtonStates(block, 'button:OK'),

      cancel: parseButtonStates(block, 'button:Cancel'),

    },

    stopAttackPower: parseStopAttackPower(block, stopAttackNextSection),

    progressAlert: parseProgressAlert(block),

  };

}



function parseBonusStatBlock(block) {
  const vec = (name) => {
    const m = block.match(new RegExp(`<vector name="${name}" value="([^"]+)"`));
    return m ? parseVector(m[1]) : null;
  };

  const bgM = block.match(/<png name="backgrnd"[\s\S]*?<string name="_outlink" value="([^"]+)"/);
  const viewM = block.match(/<dir name="bonusStatView">([\s\S]*?)<\/dir>\s*<\/dir>\s*<dir name="fullScreen_autoEnchant">/);
  const viewBlock = viewM ? viewM[1] : '';
  const viewBgM = viewBlock.match(/<png name="backgrnd"[\s\S]*?<string name="_outlink" value="([^"]+)"/);

  return {
    backgrnd: bgM ? outlinkToLocal(bgM[1]) : null,
    sectionLT: vec('vector:sectionLT'),
    sectionRB: vec('vector:sectionRB'),
    progressAlertOffset: vec('vector:progressAlertOffset'),
    subWndMargin: vec('vector:subWndMargin'),
    bonusStatView: {
      backgrnd: viewBgM ? outlinkToLocal(viewBgM[1]) : null,
      combos: {
        opt1: parseComboBox(viewBlock, 'combo:opt1'),
        opt2: parseComboBox(viewBlock, 'combo:opt2'),
        opt3: parseComboBox(viewBlock, 'combo:opt3'),
        opt4: parseComboBox(viewBlock, 'combo:opt4'),
      },
      reset: parseButtonStates(viewBlock, 'button:reset'),
    },
    buttons: {
      ok: parseButtonStates(block, 'button:OK'),
      cancel: parseButtonStates(block, 'button:Cancel'),
    },
    stopAttackPower: parseStopAttackPower(block, 'scroll'),
    progressAlert: parseProgressAlert(block),
  };
}


function parseCommonAutoEnchantButton(xml) {

  const block = xml.match(/<dir name="button_autoEnchant">([\s\S]*?)<\/dir>\s*<dir name="button_showEffect">/);

  if (!block) return null;

  return parseButtonStates(block[0], 'button');

}



const xml = fs.readFileSync(XML, 'utf8');

const sfBlock = extractAutoEnchantSection(xml, 'starForce');

const potBlock = extractAutoEnchantSection(xml, 'potential');
const apBlock = extractAutoEnchantSection(xml, 'additionalPotential');
const bsBlock = extractAutoEnchantSection(xml, 'bonusStat');



if (!sfBlock) {

  console.error('autoEnchant/starForce block not found');

  process.exit(1);

}

if (!potBlock) {

  console.error('autoEnchant/potential block not found');

  process.exit(1);

}

if (!apBlock) {

  console.error('autoEnchant/additionalPotential block not found');

  process.exit(1);

}



const starForce = parseStarForceBlock(sfBlock);

const potential = parsePotentialBlock(potBlock, 'additionalPotential');

const additionalPotential = parsePotentialBlock(apBlock, 'bonusStat');
const bonusStat = bsBlock ? parseBonusStatBlock(bsBlock) : null;

const commonButton = parseCommonAutoEnchantButton(xml);



const summary = {

  source: 'UI.Enchant.img.xml',

  path: 'Enchant.img/autoEnchant',

  starForce,

  potential,

  additionalPotential,

  bonusStat,

  commonButton,

  sections: ['starForce', 'potential', 'additionalPotential', 'bonusStat', 'scroll', 'hammer'],

};



fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

fs.writeFileSync(OUT_JSON, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');



const js = `/**

 * Enchant.img/autoEnchant 版面常數（自動產生）

 * 來源：UI.Enchant.img.xml → scripts/parse-auto-enchant.mjs

 * 素材路徑：images/autoEnchant/…（待匯入 WZ _outlink）

 */



/** 啟用官方自動強化彈窗（false 時僅使用舊版 checkbox） */

const AUTO_ENCHANT_USE_OVERLAY = true;



const AUTO_ENCHANT_IMAGE_BASE = 'images/autoEnchant/';



const AUTO_ENCHANT_STAR_FORCE = ${JSON.stringify(starForce, null, 2)};



const AUTO_ENCHANT_POTENTIAL = ${JSON.stringify(potential, null, 2)};

const AUTO_ENCHANT_ADD_POTENTIAL = ${JSON.stringify(additionalPotential, null, 2)};

const AUTO_ENCHANT_BONUS_STAT = ${JSON.stringify(bonusStat, null, 2)};

const AUTO_ENCHANT_COMMON_BUTTON = ${JSON.stringify(commonButton, null, 2)};



function autoEnchantAssetPath(relativePath) {

  if (!relativePath) return null;

  if (/^images\\//.test(relativePath)) return relativePath;

  return AUTO_ENCHANT_IMAGE_BASE + relativePath;

}

`;

const MANUAL_MARKER = '// @manual-auto-enchant-logic';
let manualTail = '';
if (fs.existsSync(OUT_JS)) {
  const existing = fs.readFileSync(OUT_JS, 'utf8');
  const markerIndex = existing.indexOf(MANUAL_MARKER);
  if (markerIndex !== -1) {
    manualTail = `\n${existing.slice(markerIndex)}`;
  }
}

fs.writeFileSync(OUT_JS, `${js}${manualTail}`, 'utf8');

console.log('Wrote', OUT_JS);

console.log('Wrote', OUT_JSON);

