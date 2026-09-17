'use strict';

/**
 * 依環境變數 R2_PUBLIC_BASE_URL 寫入 cdn-config.json，
 * 並同步 package.json 的 electron-builder generic publish.url。
 *
 * 例：R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev
 *   → updateBaseUrl = .../desktop
 *   → assetsBaseUrl = .../assets
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cdnPath = path.join(__dirname, 'cdn-config.json');
const pkgPath = path.join(root, 'package.json');

function trimSlash(u) {
  return String(u || '').trim().replace(/\/+$/, '');
}

function main() {
  const fromEnv = trimSlash(process.env.R2_PUBLIC_BASE_URL);
  let cdn = { updateBaseUrl: '', assetsBaseUrl: '' };
  try {
    cdn = JSON.parse(fs.readFileSync(cdnPath, 'utf8'));
  } catch (_) { /* ignore */ }

  if (fromEnv) {
    cdn.updateBaseUrl = `${fromEnv}/desktop`;
    cdn.assetsBaseUrl = `${fromEnv}/assets`;
  }

  cdn.updateBaseUrl = trimSlash(cdn.updateBaseUrl);
  cdn.assetsBaseUrl = trimSlash(cdn.assetsBaseUrl);

  if (!cdn.updateBaseUrl) {
    console.error('缺少 CDN 位址。請設定環境變數 R2_PUBLIC_BASE_URL，或編輯 desktop/cdn-config.json');
    process.exit(1);
  }

  fs.writeFileSync(cdnPath, `${JSON.stringify(cdn, null, 2)}\n`, 'utf8');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.build = pkg.build || {};
  pkg.build.publish = {
    provider: 'generic',
    url: cdn.updateBaseUrl,
  };
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  console.log(`CDN update: ${cdn.updateBaseUrl}`);
  console.log(`CDN assets: ${cdn.assetsBaseUrl || '(none)'}`);
}

main();
