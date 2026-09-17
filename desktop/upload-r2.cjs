'use strict';

/**
 * 上傳桌面安裝檔或資源包到 Cloudflare R2（S3 相容 API）。
 *
 * 必要環境變數：
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *
 * 用法：
 *   node desktop/upload-r2.cjs desktop   # dist-desktop Setup / latest.yml / blockmap → desktop/
 *   node desktop/upload-r2.cjs assets    # dist-assets/*.zip → assets/
 */

const fs = require('fs');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

const root = path.join(__dirname, '..');

function requireEnv(name) {
  const v = String(process.env[name] || '').trim();
  if (!v) {
    throw new Error(`缺少環境變數 ${name}`);
  }
  return v;
}

function listFiles(dir, pred) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter((p) => fs.statSync(p).isFile() && pred(path.basename(p)));
}

function collect(mode) {
  if (mode === 'desktop') {
    const dir = path.join(root, 'dist-desktop');
    const files = [
      ...listFiles(dir, (n) => /^MapleEnchantSimulator-Setup-.*\.exe$/i.test(n)),
      ...listFiles(dir, (n) => n === 'latest.yml'),
      ...listFiles(dir, (n) => /\.exe\.blockmap$/i.test(n)),
    ];
    return files.map((file) => ({ file, key: `desktop/${path.basename(file)}` }));
  }
  if (mode === 'assets') {
    const dir = path.join(root, 'dist-assets');
    return listFiles(dir, (n) => n.toLowerCase().endsWith('.zip'))
      .map((file) => ({ file, key: `assets/${path.basename(file)}` }));
  }
  throw new Error(`未知模式：${mode}（用 desktop 或 assets）`);
}

async function uploadOne(client, bucket, item) {
  const size = fs.statSync(item.file).size;
  console.log(`Uploading ${item.key} (${(size / (1024 * 1024)).toFixed(1)} MB) ...`);
  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: item.key,
      Body: fs.createReadStream(item.file),
      ContentType: contentTypeFor(item.file),
    },
    queueSize: 4,
    partSize: 16 * 1024 * 1024,
    leavePartsOnError: false,
  });
  upload.on('httpUploadProgress', (p) => {
    if (!p.total) return;
    const pct = ((p.loaded / p.total) * 100).toFixed(0);
    process.stdout.write(`\r  ${item.key} ${pct}%`);
  });
  await upload.done();
  process.stdout.write(`\r  ${item.key} done          \n`);
}

function contentTypeFor(file) {
  const n = path.basename(file).toLowerCase();
  if (n.endsWith('.yml') || n.endsWith('.yaml')) return 'text/yaml; charset=utf-8';
  if (n.endsWith('.exe')) return 'application/octet-stream';
  if (n.endsWith('.zip')) return 'application/zip';
  if (n.endsWith('.blockmap')) return 'application/octet-stream';
  return 'application/octet-stream';
}

async function main() {
  const mode = String(process.argv[2] || '').trim();
  if (mode !== 'desktop' && mode !== 'assets') {
    console.error('用法: node desktop/upload-r2.cjs <desktop|assets>');
    process.exit(1);
  }

  const accountId = requireEnv('R2_ACCOUNT_ID');
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
  const bucket = requireEnv('R2_BUCKET');

  const items = collect(mode);
  if (!items.length) {
    throw new Error(`找不到要上傳的檔案（模式 ${mode}）`);
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  for (const item of items) {
    await uploadOne(client, bucket, item);
  }

  const pub = String(process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  if (pub) {
    console.log(`Public base: ${pub}`);
    for (const item of items) {
      console.log(`  ${pub}/${item.key}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
