'use strict';

const fs = require('fs');
const path = require('path');

async function main() {
  const archiver = require('archiver');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset-manifest.json'), 'utf8'));
  const outDir = path.join(root, 'dist-assets');
  fs.mkdirSync(outDir, { recursive: true });
  const assetVer = String(manifest.version || pkg.version);

  for (const pack of manifest.packs || []) {
    const srcDir = path.join(root, 'images', pack.dest);
    if (!fs.existsSync(srcDir)) {
      throw new Error(`找不到資源資料夾：${srcDir}`);
    }
    const fileName = `${pack.filePrefix}-${assetVer}.zip`;
    const dest = path.join(outDir, fileName);
    process.stdout.write(`packing ${pack.dest} -> ${fileName}\n`);
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(dest);
      const archive = archiver('zip', { zlib: { level: 4 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(srcDir, false);
      archive.finalize();
    });
    const size = fs.statSync(dest).size;
    process.stdout.write(`  ${fileName} ${(size / (1024 * 1024)).toFixed(1)} MB\n`);
    if (size >= 2 * 1024 * 1024 * 1024) {
      throw new Error(`${fileName} 超過 GitHub 單檔 2GB，請再拆包`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
