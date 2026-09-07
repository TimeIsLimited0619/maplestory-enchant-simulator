const fs = require('fs');

const pdata = fs.readFileSync('js/paperdollData.js', 'utf8');

function findItemBlob(id) {
  const needle = `"${id}":`;
  const idx = pdata.indexOf(needle);
  if (idx < 0) return null;
  // after key, find opening {
  let i = idx + needle.length;
  while (i < pdata.length && /\s/.test(pdata[i])) i++;
  if (pdata[i] !== '{') return null;
  let depth = 0;
  const start = i;
  for (; i < pdata.length; i++) {
    const c = pdata[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return pdata.slice(start, i + 1);
    }
  }
  return null;
}

const capBlob = findItemBlob('01002357');
const hairBlob = findItemBlob('00071301');
console.log('cap blob length', capBlob?.length);
console.log('hair blob length', hairBlob?.length);

if (capBlob) {
  const zs = [...capBlob.matchAll(/"z":"([^"]+)"/g)].map((x) => x[1]);
  console.log('cap paperdoll zs', [...new Set(zs)]);
  const info = capBlob.match(/"info":\{[^}]+\}/);
  console.log('cap info', info && info[0]);
  // sample first action names
  const acts = [...capBlob.matchAll(/"([a-zA-Z0-9]+)":\{"frames"/g)].map((x) => x[1]);
  console.log('cap actions sample', acts.slice(0, 10));
}

if (hairBlob) {
  const zs = [...hairBlob.matchAll(/"z":"([^"]+)"/g)].map((x) => x[1]);
  const counts = {};
  zs.forEach((z) => { counts[z] = (counts[z] || 0) + 1; });
  console.log('hair paperdoll z counts', counts);
}

// Compare with a normal halfcover cap that works
for (const id of ['01002001', '01002005', '01002067', '01002357', '01003112', '01004119']) {
  const blob = findItemBlob(id);
  if (!blob) {
    console.log(id, 'MISSING from paperdollData');
    continue;
  }
  const info = (blob.match(/"info":(\{[^}]*\})/) || [])[1];
  const zs = [...new Set([...blob.matchAll(/"z":"([^"]+)"/g)].map((x) => x[1]))];
  console.log(id, info, 'zs', zs);
}
