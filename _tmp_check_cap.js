const fs = require('fs');

function extractRecord(src, id) {
  const needle = `"id":"${id}"`;
  const idx = src.indexOf(needle);
  if (idx < 0) return null;
  const start = src.lastIndexOf('{', idx);
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

const wz = fs.readFileSync('js/wzImportedEquips.js', 'utf8');
const pdItems = fs.readFileSync('js/paperdollItems.js', 'utf8');
const pdata = fs.readFileSync('js/paperdollData.js', 'utf8');

console.log('wz record:', extractRecord(wz, '01002357'));
console.log('paperdollItems has 01002357:', pdItems.includes('01002357'));
console.log('paperdollItems record:', extractRecord(pdItems, '01002357'));
console.log('paperdollData has 01002357:', pdata.includes('01002357'));

// How many times does 01002357 appear in wz?
let count = 0;
let pos = 0;
while ((pos = wz.indexOf('"01002357"', pos)) >= 0) {
  count++;
  pos += 1;
}
console.log('wz occurrences:', count);

const hair = fs.readFileSync('wz-xml/character/hair/Character.Hair.00071301.img.xml', 'utf8');
const zs = [...hair.matchAll(/name="z"[^>]*value="([^"]+)"/g)].map((x) => x[1]);
console.log('hair z unique:', [...new Set(zs)]);

const cap = fs.readFileSync('wz-xml/character/cap/Character.Cap.01002357.img.xml', 'utf8');
const vslot = (cap.match(/name="vslot"[^>]*value="([^"]+)"/) || [])[1];
const islot = (cap.match(/name="islot"[^>]*value="([^"]+)"/) || [])[1];
console.log({ islot, vslot });
const capz = [...cap.matchAll(/name="z"[^>]*value="([^"]+)"/g)].map((x) => x[1]);
console.log('cap z unique:', [...new Set(capz)]);

// Check paperdoll frames for hair and cap
const framesMatch = pdata.match(/"01002357"\s*:\s*\{/);
console.log('paperdollData key match:', !!framesMatch);

// Look for hair parts in paperdoll data for default hair
const hairKey = '"00071301"';
const hidx = pdata.indexOf(hairKey);
console.log('hair in paperdollData idx:', hidx);
if (hidx >= 0) {
  const snippet = pdata.slice(hidx, hidx + 2000);
  const hairZs = [...snippet.matchAll(/"z":"([^"]+)"/g)].map((x) => x[1]);
  console.log('sample hair zs from data:', [...new Set(hairZs)]);
}
