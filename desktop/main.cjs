'use strict';

const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  protocol,
  net,
  nativeImage,
  dialog,
} = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { autoUpdater } = require('electron-updater');

const GH_OWNER = 'TimeIsLimited0619';
const GH_REPO = 'maplestory-enchant-simulator';
const ASSET_MANIFEST = require('./asset-manifest.json');
const LARGE_PACK_IDS = new Set((ASSET_MANIFEST.packs || []).map((p) => p.dest));

protocol.registerSchemesAsPrivileged([{
  scheme: 'mss',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: true,
  },
}]);

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('js-flags', '--expose-gc');

app.setName('MapleEnchantSimulator');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.timeislimited.mapleenchant');
}
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'MapleEnchantSimulator'));
} catch (_) { /* ignore */ }

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

/** @type {BrowserWindow|null} */
let mainWindow = null;
/** @type {BrowserWindow|null} */
let splashWindow = null;
/** @type {Tray|null} */
let tray = null;
let isQuitting = false;
let assetEnsurePromise = null;
let updateDownloaded = false;
let updaterArmed = false;
let splashCanClose = false;
let cachedImageRoots = null;
let splashConfirmResolve = null;

const DOWNLOAD_UA = 'MapleEnchantSimulator';
const RANGE_PARTS = 8;

const DEFAULT_SETTINGS = {
  closeToTray: true,
  forceGcOnHide: false,
  assetDir: '',
  assetSourceDir: '',
};

function projectRoot() {
  return app.isPackaged
    ? app.getAppPath()
    : path.join(__dirname, '..');
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'desktop-settings.json');
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const data = JSON.parse(raw);
    let assetDir = '';
    let assetSourceDir = '';
    if (typeof data?.assetDir === 'string' && data.assetDir.trim()) {
      assetDir = path.resolve(data.assetDir.trim());
    }
    if (typeof data?.assetSourceDir === 'string' && data.assetSourceDir.trim()) {
      assetSourceDir = path.resolve(data.assetSourceDir.trim());
    }
    return {
      closeToTray: data?.closeToTray !== false,
      forceGcOnHide: !!data?.forceGcOnHide,
      assetDir,
      assetSourceDir,
    };
  } catch (_) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(next) {
  const merged = { ...loadSettings(), ...next };
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(settingsPath(), `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged;
}

function iconPath() {
  if (app.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'icon.png');
    if (fs.existsSync(unpacked)) return unpacked;
  }
  return path.join(__dirname, 'icon.png');
}

function isPathInside(root, target) {
  const rootAbs = path.resolve(root) + path.sep;
  const targetAbs = path.resolve(target);
  return targetAbs === path.resolve(root) || targetAbs.startsWith(rootAbs);
}

function extraImagesRoot() {
  return path.join(process.resourcesPath, 'images');
}

function defaultAssetRoot() {
  return path.join(app.getPath('userData'), 'assets');
}

function assetRoot() {
  const custom = loadSettings().assetDir;
  if (custom) return custom;
  return defaultAssetRoot();
}

function downloadedImagesRoot() {
  return path.join(assetRoot(), 'images');
}

function invalidateImageRoots() {
  cachedImageRoots = null;
}

function imageRoots() {
  if (cachedImageRoots) return cachedImageRoots;
  if (!app.isPackaged) {
    cachedImageRoots = {
      defaultRoot: path.join(projectRoot(), 'images'),
      packRoots: {},
    };
    return cachedImageRoots;
  }
  const extra = extraImagesRoot();
  const downloaded = downloadedImagesRoot();
  const packRoots = {};
  LARGE_PACK_IDS.forEach((dest) => {
    const dl = path.join(downloaded, dest);
    packRoots[dest] = fs.existsSync(dl) ? downloaded : extra;
  });
  cachedImageRoots = { defaultRoot: extra, packRoots };
  return cachedImageRoots;
}

function resolveImageFile(imgRel) {
  const safeRel = path.normalize(imgRel).replace(/^(\.\.(\/|\\|$))+/, '');
  const first = safeRel.split(/[\\/]/)[0];
  const roots = imageRoots();
  const packRoot = roots.packRoots[first];
  if (packRoot) return path.join(packRoot, safeRel);
  return path.join(roots.defaultRoot, safeRel);
}

function resolveGameFile(rel) {
  const decoded = String(rel || '').replace(/\\/g, '/');
  const trimmed = decoded.replace(/^\/+/, '');
  const safeRel = path.normalize(trimmed).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!safeRel || safeRel === '.' || safeRel === path.sep) {
    return path.join(projectRoot(), 'index.html');
  }
  if (safeRel === 'images' || safeRel.startsWith(`images${path.sep}`) || safeRel.startsWith('images/')) {
    const imgRel = safeRel.replace(/^images[\\/]/, '');
    return resolveImageFile(imgRel);
  }
  const target = path.join(projectRoot(), safeRel);
  if (!isPathInside(projectRoot(), target)) {
    return path.join(projectRoot(), 'index.html');
  }
  return target;
}

function registerMssProtocol() {
  protocol.handle('mss', (request) => {
    const url = new URL(request.url);
    let rel = decodeURIComponent(url.pathname || '/');
    if (rel.endsWith('/')) rel += 'index.html';
    const filePath = resolveGameFile(rel);
    try {
      if (!fs.statSync(filePath).isFile()) {
        return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
      }
    } catch (_) {
      // 遊戲會預載很多可選圖（技能幀、怪物死亡等），缺檔在瀏覽器只是 404。
      // 若仍走 net.fetch(file://) ，Electron 會把每個 ERR_FILE_NOT_FOUND 打到 cmd。
      return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
    }
    return net.fetch(pathToFileURL(filePath).href);
  });
}

function sendSplash(payload) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash:progress', payload);
  }
}

function sendUpdate(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('desktop:update-status', payload);
  }
}

function packIsBundled(pack) {
  if (!app.isPackaged) return true;
  const extra = path.join(extraImagesRoot(), pack.dest);
  try {
    return fs.existsSync(extra) && fs.readdirSync(extra).length > 0;
  } catch (_) {
    return false;
  }
}

function packMarkerPath(pack) {
  return path.join(downloadedImagesRoot(), pack.dest, '.pack-version');
}

function packIsReady(pack) {
  if (packIsBundled(pack)) return true;
  try {
    const marker = packMarkerPath(pack);
    if (!fs.existsSync(marker)) return false;
    return fs.readFileSync(marker, 'utf8').trim() === String(ASSET_MANIFEST.version || '');
  } catch (_) {
    return false;
  }
}

function missingPacks() {
  return (ASSET_MANIFEST.packs || []).filter((pack) => !packIsReady(pack));
}

function assetGithubTags(appVersion) {
  const tags = [];
  const add = (tag) => {
    const t = String(tag || '').trim();
    if (!t || tags.includes(t)) return;
    tags.push(t);
  };
  add(ASSET_MANIFEST.githubTag);
  add(`v${appVersion}`);
  add('v1.0.1');
  add('v1.0.0');
  return tags;
}

function packDownloadUrls(fileName, appVersion) {
  return assetGithubTags(appVersion).map((tag) => (
    `https://github.com/${GH_OWNER}/${GH_REPO}/releases/download/${tag}/${fileName}`
  ));
}

function addSearchDir(dirs, candidate) {
  if (!candidate) return;
  try {
    const abs = path.resolve(candidate);
    if (!dirs.includes(abs)) dirs.push(abs);
  } catch (_) { /* ignore */ }
}

function localSearchDirs() {
  const dirs = [];
  try { addSearchDir(dirs, path.join(process.resourcesPath, 'asset-packs')); } catch (_) { /* ignore */ }
  try {
    const exeDir = path.dirname(app.getPath('exe'));
    addSearchDir(dirs, path.join(exeDir, 'asset-packs'));
    addSearchDir(dirs, exeDir);
  } catch (_) { /* ignore */ }
  addSearchDir(dirs, assetRoot());
  addSearchDir(dirs, path.join(assetRoot(), 'tmp'));
  addSearchDir(dirs, path.join(assetRoot(), 'images'));
  try { addSearchDir(dirs, app.getPath('downloads')); } catch (_) { /* ignore */ }
  try { addSearchDir(dirs, app.getPath('desktop')); } catch (_) { /* ignore */ }
  const src = loadSettings().assetSourceDir;
  if (src) {
    addSearchDir(dirs, src);
    addSearchDir(dirs, path.join(src, 'images'));
  }
  return dirs;
}

function isPackZipName(pack, name) {
  const file = String(name || '');
  if (!file.toLowerCase().endsWith('.zip')) return false;
  return file.startsWith(pack.filePrefix);
}

function findLocalZip(pack) {
  const exact = `${pack.filePrefix}-${String(ASSET_MANIFEST.version || app.getVersion())}.zip`;
  for (const dir of localSearchDirs()) {
    try {
      const exactPath = path.join(dir, exact);
      if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) return exactPath;
      const hit = fs.readdirSync(dir).find((name) => isPackZipName(pack, name));
      if (hit) {
        const full = path.join(dir, hit);
        if (fs.statSync(full).isFile()) return full;
      }
    } catch (_) { /* ignore */ }
  }
  return null;
}

function unpackedDirHasFiles(dir) {
  try {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false;
    return fs.readdirSync(dir).some((name) => name !== '.pack-version');
  } catch (_) {
    return false;
  }
}

function findLocalUnpacked(pack) {
  for (const dir of localSearchDirs()) {
    const candidates = [
      path.join(dir, pack.dest),
      path.join(dir, 'images', pack.dest),
    ];
    if (path.basename(dir) === pack.dest) candidates.unshift(dir);
    for (const candidate of candidates) {
      if (unpackedDirHasFiles(candidate)) return candidate;
    }
  }
  return null;
}

function localPackStatus() {
  const needed = missingPacks();
  const found = [];
  const missing = [];
  needed.forEach((pack) => {
    const zip = findLocalZip(pack);
    const dir = findLocalUnpacked(pack);
    if (zip || dir) found.push({ id: pack.id, zip, dir });
    else missing.push(pack);
  });
  return {
    needed,
    found,
    missing,
    allLocal: needed.length > 0 && missing.length === 0,
  };
}

function splashReadyPayload() {
  const dest = downloadedImagesRoot();
  const st = localPackStatus();
  if (st.allLocal) {
    return {
      state: 'ready',
      percent: 0,
      message: `已找到本機資源包（${st.found.length}/${st.needed.length}），不需再從網路下載。`,
      detail: dest,
      path: dest,
      startLabel: '開始安裝資源',
    };
  }
  if (st.found.length) {
    return {
      state: 'ready',
      percent: 0,
      message: `已找到 ${st.found.length}/${st.needed.length} 個本機資源包，其餘改從網路下載。也可再指定 Google Drive 下載的資料夾。`,
      detail: dest,
      path: dest,
      startLabel: '開始安裝／下載',
    };
  }
  return {
    state: 'ready',
    percent: 0,
    message: '首次啟動需要 BOSS 動畫與技能特效（約 1.7GB）。可先從 Google Drive 下載 zip 再選資料夾，或直接下載。',
    detail: dest,
    path: dest,
    startLabel: '開始下載',
  };
}

async function installUnpackedPack(unpacked, unpackDir) {
  const same = path.resolve(unpacked) === path.resolve(unpackDir);
  if (same) return;
  await fs.promises.mkdir(path.dirname(unpackDir), { recursive: true });
  await fs.promises.rm(unpackDir, { recursive: true, force: true });
  await fs.promises.symlink(unpacked, unpackDir, 'junction');
}

function formatSpeed(bps) {
  const v = Number(bps) || 0;
  if (v <= 0) return '';
  if (v < 1024) return `${v.toFixed(0)} B/s`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB/s`;
  return `${(v / (1024 * 1024)).toFixed(1)} MB/s`;
}

function makeSpeedMeter() {
  let lastT = Date.now();
  let lastB = 0;
  let speed = 0;
  return {
    sample(received) {
      const now = Date.now();
      const dt = now - lastT;
      if (dt >= 350) {
        speed = (received - lastB) / (dt / 1000);
        lastT = now;
        lastB = received;
      }
      return speed;
    },
  };
}

async function probeDownload(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': DOWNLOAD_UA, Range: 'bytes=0-0' },
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(`下載失敗 HTTP ${res.status}`);
  }
  const cr = res.headers.get('content-range');
  let total = 0;
  if (cr) {
    const m = /\/(\d+)\s*$/.exec(cr);
    if (m) total = Number(m[1]) || 0;
  }
  if (!total) total = Number(res.headers.get('content-length')) || 0;
  const ranged = res.status === 206 && total > 1;
  try {
    if (res.body && typeof res.body.cancel === 'function') await res.body.cancel();
  } catch (_) { /* ignore */ }
  return { total, ranged };
}

async function readStreamToOffset(res, dest, start, onChunk) {
  const fh = await fs.promises.open(dest, 'r+');
  try {
    let offset = start;
    if (!res.body || typeof res.body.getReader !== 'function') {
      const buf = Buffer.from(await res.arrayBuffer());
      await fh.write(buf, 0, buf.length, offset);
      if (onChunk) onChunk(buf.length);
      return;
    }
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const buf = Buffer.from(value);
      await fh.write(buf, 0, buf.length, offset);
      offset += buf.length;
      if (onChunk) onChunk(buf.length);
    }
  } finally {
    await fh.close();
  }
}

async function downloadRanged(url, dest, total, onProgress) {
  const parts = Math.min(RANGE_PARTS, Math.max(1, Math.ceil(total / (8 * 1024 * 1024))));
  const chunkSize = Math.ceil(total / parts);
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const fh = await fs.promises.open(dest, 'w');
  try {
    await fh.truncate(total);
  } finally {
    await fh.close();
  }
  let received = 0;
  const meter = makeSpeedMeter();
  const notify = () => {
    if (onProgress) onProgress(received, total, meter.sample(received));
  };
  const tasks = [];
  for (let i = 0; i < parts; i += 1) {
    const start = i * chunkSize;
    const end = Math.min(total, start + chunkSize) - 1;
    if (start > end) break;
    tasks.push((async () => {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': DOWNLOAD_UA,
          Range: `bytes=${start}-${end}`,
        },
      });
      if (!res.ok && res.status !== 206) {
        throw new Error(`下載失敗 HTTP ${res.status}`);
      }
      await readStreamToOffset(res, dest, start, (n) => {
        received += n;
        notify();
      });
    })());
  }
  await Promise.all(tasks);
  notify();
}

async function downloadSingle(url, dest, total, onProgress) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': DOWNLOAD_UA },
  });
  if (!res.ok) {
    throw new Error(`下載失敗 HTTP ${res.status}`);
  }
  const size = total || Number(res.headers.get('content-length')) || 0;
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const file = fs.createWriteStream(dest);
  const meter = makeSpeedMeter();
  let received = 0;
  try {
    if (!res.body || typeof res.body.getReader !== 'function') {
      const buf = Buffer.from(await res.arrayBuffer());
      await new Promise((resolve, reject) => {
        file.end(buf, (err) => (err ? reject(err) : resolve()));
      });
      if (onProgress) onProgress(buf.length, buf.length || size, 0);
      return;
    }
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (!file.write(Buffer.from(value))) {
        await new Promise((resolve) => file.once('drain', resolve));
      }
      if (onProgress) onProgress(received, size, meter.sample(received));
    }
    await new Promise((resolve, reject) => {
      file.end((err) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    try { file.destroy(); } catch (_) { /* ignore */ }
    try { await fs.promises.unlink(dest); } catch (_) { /* ignore */ }
    throw err;
  }
}

async function downloadToFile(url, dest, onProgress) {
  const probe = await probeDownload(url);
  if (probe.ranged && probe.total > 4 * 1024 * 1024) {
    try {
      await downloadRanged(url, dest, probe.total, onProgress);
      return;
    } catch (_) {
      try { await fs.promises.unlink(dest); } catch (e) { /* ignore */ }
    }
  }
  await downloadSingle(url, dest, probe.total, onProgress);
}

async function extractZip(zipPath, destDir) {
  const extract = require('extract-zip');
  await fs.promises.rm(destDir, { recursive: true, force: true });
  await fs.promises.mkdir(destDir, { recursive: true });
  await extract(zipPath, { dir: destDir });
}

function formatBytes(n) {
  const v = Number(n) || 0;
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`;
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function ensureLargeAssets() {
  if (!app.isPackaged) return;
  const needed = missingPacks();
  if (!needed.length) return;

  const version = app.getVersion();
  const assetVer = String(ASSET_MANIFEST.version || version);
  const destRoot = downloadedImagesRoot();
  await fs.promises.mkdir(destRoot, { recursive: true });

  for (let i = 0; i < needed.length; i += 1) {
    const pack = needed[i];
    const fileName = `${pack.filePrefix}-${assetVer}.zip`;
    const unpackDir = path.join(destRoot, pack.dest);
    const localUnpacked = findLocalUnpacked(pack);
    const localZip = findLocalZip(pack);

    if (localUnpacked) {
      sendSplash({
        state: 'extract',
        percent: ((i + 0.4) / needed.length) * 100,
        message: `正在套用本機${pack.label || pack.id}（${i + 1}/${needed.length}）…`,
        detail: localUnpacked,
      });
      await installUnpackedPack(localUnpacked, unpackDir);
      await fs.promises.writeFile(packMarkerPath(pack), `${assetVer}\n`, 'utf8');
      continue;
    }

    if (localZip) {
      sendSplash({
        state: 'extract',
        percent: ((i + 0.4) / needed.length) * 100,
        message: `正在解壓本機${pack.label || pack.id}（${i + 1}/${needed.length}）…`,
        detail: localZip,
      });
      await extractZip(localZip, unpackDir);
      await fs.promises.writeFile(packMarkerPath(pack), `${assetVer}\n`, 'utf8');
      continue;
    }

    const urls = packDownloadUrls(fileName, version);
    const zipPath = path.join(assetRoot(), 'tmp', fileName);
    sendSplash({
      state: 'download',
      percent: Math.round((i / needed.length) * 100),
      message: `正在下載${pack.label || pack.id}（${i + 1}/${needed.length}）…`,
      detail: '使用多連線下載以加快速度。',
    });
    let downloaded = false;
    let lastErr = null;
    for (const url of urls) {
      try {
        await downloadToFile(url, zipPath, (received, total, speed) => {
          const packPct = total > 0 ? received / total : 0;
          const percent = ((i + packPct) / needed.length) * 100;
          const spd = formatSpeed(speed);
          sendSplash({
            state: 'download',
            percent,
            message: `正在下載${pack.label || pack.id}（${i + 1}/${needed.length}）…`,
            detail: total > 0
              ? `${formatBytes(received)} / ${formatBytes(total)}${spd ? ` · ${spd}` : ''}`
              : `${formatBytes(received)}${spd ? ` · ${spd}` : ''}`,
          });
        });
        downloaded = true;
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!downloaded) throw lastErr || new Error('下載資源包失敗');
    sendSplash({
      state: 'extract',
      percent: ((i + 0.92) / needed.length) * 100,
      message: `正在解壓${pack.label || pack.id}…`,
      detail: '',
    });
    await extractZip(zipPath, unpackDir);
    await fs.promises.writeFile(packMarkerPath(pack), `${assetVer}\n`, 'utf8');
    try { await fs.promises.unlink(zipPath); } catch (_) { /* ignore */ }
  }
  invalidateImageRoots();
}

function waitForSplashConfirm() {
  return new Promise((resolve) => {
    splashConfirmResolve = resolve;
  });
}

function resolveSplashConfirm() {
  if (!splashConfirmResolve) return false;
  const fn = splashConfirmResolve;
  splashConfirmResolve = null;
  fn();
  return true;
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 560,
    height: 430,
    frame: false,
    resizable: false,
    show: true,
    title: '放置谷',
    backgroundColor: '#161A23',
    icon: iconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'splash-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  splashWindow.setMenuBarVisibility(false);
  splashWindow.on('close', (event) => {
    if (!isQuitting && !splashCanClose) event.preventDefault();
  });
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
  return new Promise((resolve) => {
    splashWindow.webContents.once('did-finish-load', () => resolve(splashWindow));
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  });
}

function releaseRendererMemory() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.session.clearCache().catch(() => {});
  if (loadSettings().forceGcOnHide) {
    mainWindow.webContents.executeJavaScript('void (globalThis.gc && globalThis.gc())').catch(() => {});
  }
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  if (tray) return tray;
  let image = nativeImage.createFromPath(iconPath());
  if (image.isEmpty()) {
    image = nativeImage.createEmpty();
  } else if (process.platform === 'win32') {
    image = image.resize({ width: 16, height: 16 });
  }
  tray = new Tray(image);
  tray.setToolTip('放置谷');
  const menu = Menu.buildFromTemplate([
    {
      label: '顯示視窗',
      click: () => showMainWindow(),
    },
    { type: 'separator' },
    {
      label: '結束遊戲',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => showMainWindow());
  return tray;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: '放置谷',
    backgroundColor: '#161A23',
    icon: iconPath(),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setBackgroundThrottling(false);
  mainWindow.once('ready-to-show', () => {
    splashCanClose = true;
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
  });
  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    if (loadSettings().closeToTray) {
      event.preventDefault();
      mainWindow.setSkipTaskbar(true);
      mainWindow.hide();
    }
  });
  mainWindow.on('hide', () => {
    releaseRendererMemory();
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.loadURL('mss://app/index.html');
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => {
    if (updateDownloaded) return;
    sendUpdate({ state: 'checking', message: '正在檢查更新…' });
  });
  autoUpdater.on('update-available', (info) => {
    if (updateDownloaded) return;
    sendUpdate({
      state: 'available',
      version: info?.version || '',
      message: `發現新版本 ${info?.version || ''}，開始下載…`,
    });
  });
  autoUpdater.on('update-not-available', () => {
    if (updateDownloaded) {
      sendUpdate({
        state: 'ready',
        message: '更新已下載。掛機結束後按「重開並套用更新」。',
      });
      return;
    }
    sendUpdate({ state: 'idle', message: '已是最新版本。' });
  });
  autoUpdater.on('download-progress', (progress) => {
    if (updateDownloaded) return;
    const pct = Number(progress?.percent) || 0;
    sendUpdate({
      state: 'downloading',
      percent: pct,
      message: `正在下載更新 ${pct.toFixed(0)}%`,
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    updateDownloaded = true;
    sendUpdate({
      state: 'ready',
      version: info?.version || '',
      message: '更新已下載。掛機結束後按「重開並套用更新」。',
    });
  });
  autoUpdater.on('error', (err) => {
    if (updateDownloaded) return;
    sendUpdate({
      state: 'error',
      message: `更新失敗：${err?.message || err}`,
    });
  });
}

function bindIpc() {
  ipcMain.handle('desktop:get-info', () => {
    const settings = loadSettings();
    return {
      version: app.getVersion(),
      packaged: app.isPackaged,
      userData: app.getPath('userData'),
      saveDir: path.join(app.getPath('userData'), 'saves'),
      assetDir: downloadedImagesRoot(),
      closeToTray: settings.closeToTray,
      forceGcOnHide: settings.forceGcOnHide,
      assetVersion: ASSET_MANIFEST.version,
    };
  });

  ipcMain.handle('desktop:set-settings', (_event, patch) => {
    const next = {};
    if (patch && typeof patch.closeToTray === 'boolean') next.closeToTray = patch.closeToTray;
    if (patch && typeof patch.forceGcOnHide === 'boolean') next.forceGcOnHide = patch.forceGcOnHide;
    return saveSettings(next);
  });

  ipcMain.handle('desktop:check-updates', async () => {
    if (!app.isPackaged) {
      const payload = { state: 'idle', message: '開發模式不會檢查 GitHub 更新。' };
      sendUpdate(payload);
      return payload;
    }
    try {
      await autoUpdater.checkForUpdates();
      return { ok: true };
    } catch (err) {
      const payload = { state: 'error', message: `更新失敗：${err?.message || err}` };
      sendUpdate(payload);
      return payload;
    }
  });

  ipcMain.handle('desktop:quit-and-install', () => {
    isQuitting = true;
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
  });

  ipcMain.handle('desktop:write-save', async (_event, payload) => {
    const profile = payload?.profile === 'idle' ? 'idle' : 'sim';
    const contents = String(payload?.contents || '');
    if (!contents) return { ok: false };
    const dir = path.join(app.getPath('userData'), 'saves');
    await fs.promises.mkdir(dir, { recursive: true });
    const name = profile === 'idle' ? 'mss-save-idle.mss' : 'mss-save-sim.mss';
    const dest = path.join(dir, name);
    const tmp = `${dest}.tmp`;
    await fs.promises.writeFile(tmp, contents, 'utf8');
    await fs.promises.copyFile(tmp, dest);
    try { await fs.promises.unlink(tmp); } catch (_) { /* ignore */ }
    return { ok: true, path: dest };
  });

  ipcMain.handle('splash:pick-dir', async () => {
    const parent = splashWindow && !splashWindow.isDestroyed() ? splashWindow : undefined;
    const result = await dialog.showOpenDialog(parent, {
      title: '選擇資源存放位置',
      defaultPath: assetRoot(),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths || !result.filePaths[0]) {
      return { ok: false, path: downloadedImagesRoot() };
    }
    saveSettings({ assetDir: result.filePaths[0] });
    invalidateImageRoots();
    sendSplash(splashReadyPayload());
    return { ok: true, path: downloadedImagesRoot() };
  });

  ipcMain.handle('splash:pick-source', async () => {
    const parent = splashWindow && !splashWindow.isDestroyed() ? splashWindow : undefined;
    const result = await dialog.showOpenDialog(parent, {
      title: '選擇已下載的資源包資料夾',
      defaultPath: loadSettings().assetSourceDir || app.getPath('downloads'),
      properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths || !result.filePaths[0]) {
      return { ok: false, path: downloadedImagesRoot() };
    }
    saveSettings({ assetSourceDir: result.filePaths[0] });
    invalidateImageRoots();
    sendSplash(splashReadyPayload());
    return { ok: true, path: downloadedImagesRoot(), source: result.filePaths[0] };
  });

  ipcMain.handle('splash:start', () => {
    resolveSplashConfirm();
    return { ok: true, path: downloadedImagesRoot() };
  });

  ipcMain.handle('splash:retry', async () => {
    await startAppWindows();
    return { ok: true };
  });
}

async function startAppWindows() {
  if (assetEnsurePromise) return assetEnsurePromise;
  assetEnsurePromise = (async () => {
    try {
      createTray();
      if (app.isPackaged && missingPacks().length) {
        splashCanClose = false;
        if (!splashWindow || splashWindow.isDestroyed()) await createSplashWindow();
        sendSplash(splashReadyPayload());
        await waitForSplashConfirm();
        await ensureLargeAssets();
      }
      if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
      if (app.isPackaged && !updaterArmed) {
        updaterArmed = true;
        setTimeout(() => {
          autoUpdater.checkForUpdates().catch(() => {});
        }, 5000);
      }
    } catch (err) {
      splashCanClose = true;
      sendSplash({
        state: 'error',
        percent: 0,
        message: `資源準備失敗：${err?.message || err}`,
        detail: '請確認網路後重試。大型動畫包與安裝檔放在同一個 GitHub Release。',
        path: downloadedImagesRoot(),
      });
      throw err;
    } finally {
      assetEnsurePromise = null;
    }
  })();
  return assetEnsurePromise.catch(() => {});
}

if (gotLock) {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      showMainWindow();
      return;
    }
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
      splashWindow.focus();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('window-all-closed', () => {
    if (tray && loadSettings().closeToTray && !isQuitting) return;
    isQuitting = true;
    if (process.platform !== 'darwin') app.quit();
  });

  app.whenReady().then(async () => {
    registerMssProtocol();
    bindIpc();
    setupAutoUpdater();
    await startAppWindows();
  });
}
