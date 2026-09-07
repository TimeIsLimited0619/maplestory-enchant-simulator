const fs = require('fs');

// Simulate getCapType
const CAP_HALF_COVER_MARKERS = ['H1', 'H2', 'H3', 'H4', 'H6', 'Hd', 'Hf', 'Hs', 'Hb', 'Hc', 'Hx'];
function getCapType(vslot) {
  const s = String(vslot || '');
  if (!s) return 'none';
  const coversHairSections = CAP_HALF_COVER_MARKERS.some((m) => s.includes(m));
  const hasH5 = s.includes('H5');
  const fullFaceCover = s.includes('Ay') || s.includes('As');
  if (coversHairSections) {
    return fullFaceCover ? 'fullcover' : 'halfcover';
  }
  if (hasH5) return 'headband';
  return 'halfcover';
}

const vslots = {
  '01002001': 'CpH1H5',
  '01002005': 'CpHdH1H2H3H5HfHsFcAfAyAsAfAe',
  '01002067': 'CpH5',
  '01002357': 'CpH1H2H3H4H5HfHsHbAe',
};
for (const [id, v] of Object.entries(vslots)) {
  console.log(id, v, '->', getCapType(v));
}

// Check how getItemData resolves 01002357 - search item catalog
const files = ['js/item.js', 'js/wzImportedEquips.js', 'js/paperdollItems.js', 'js/main.js'];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const n = (src.match(/01002357/g) || []).length;
  console.log(f, 'count', n);
}

// Look at getItemData definition
const itemJs = fs.readFileSync('js/item.js', 'utf8');
const m = itemJs.match(/function getItemData[\s\S]{0,800}/);
console.log('getItemData snippet:\n', m && m[0]);

// Check PAPERDOLL_EQUIP merge / how items get into game
const main = fs.readFileSync('js/main.js', 'utf8');
const merge = main.match(/PAPERDOLL_EQUIP|WZ_IMPORTED|getItemData|mergeEquip|registerEquip[\s\S]{0,400}/g);
console.log('main mentions', merge && merge.slice(0, 20));
