const fs = require('fs');
const pdata = fs.readFileSync('js/paperdollData.js', 'utf8');
const m = pdata.match(/"zmap":\[([^\]]+)\]/);
const zmap = JSON.parse('[' + m[1] + ']');
const keys = [
  'hairOverHead', 'hair', 'hairShade', 'hairBelowBody',
  'backHair', 'backHairBelowCap',
  'cap', 'backCap', 'capBelowAccessory', 'capOverHair',
  'accessoryOverHair', 'accessoryEarOverHair', 'accessoryEyeOverCapOverHair',
];
for (const k of keys) {
  const i = zmap.indexOf(k);
  console.log(k, 'index', i, 'drawOrder(higher=front)', i < 0 ? 'MISSING' : zmap.length - i);
}

console.log('\n--- nearby zmap around hair/cap ---');
const relevant = zmap
  .map((z, i) => ({ z, i, front: zmap.length - i }))
  .filter((x) => /hair|cap|accessory|face|head/i.test(x.z));
relevant.forEach((x) => console.log(x.front, x.i, x.z));
