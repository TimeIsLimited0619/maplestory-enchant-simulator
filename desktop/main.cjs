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

const DEFAULT_SETTINGS = {
  closeToTray: true,
  forceGcOnHide: false,
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
    return {
      closeToTray: data?.closeToTray !== false,
      forceGcOnHide: !!data?.forceGcOnHide,
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

function downloadedImagesRoot() {
  return path.join(app.getPath('userData'), 'assets', 'images');
}

function resolveImageFile(imgRel) {
  const safeRel = path.normalize(imgRel).replace(/^(\.\.(\/|\\|$))+/, '');
  const first = safeRel.split(/[\\/]/)[0];
  const candidates = [];
  if (!app.isPackaged) {
    candidates.push(path.join(projectRoot(), 'images', safeRel));
  } else {
    if (LARGE_PACK_IDS.has(first)) {
      candidates.push(path.join(downloadedImagesRoot(), safeRel));
      candidates.push(path.join(extraImagesRoot(), safeRel));
    } else {
      candidates.push(path.join(extraImagesRoot(), safeRel));
      candidates.push(path.join(downloadedImagesRoot(), safeRel));
    }
    candidates.push(path.join(projectRoot(), 'images', safeRel));
  }
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    } catch (_) { /* ignore */ }
  }
  return candidates[0];
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

async function downloadToFile(url, dest, onProgress) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'MapleEnchantSimulator' },
  });
  if (!res.ok) {
    throw new Error(`下載失敗 HTTP ${res.status}`);
  }
  const total = Number(res.headers.get('content-length')) || 0;
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const file = fs.createWriteStream(dest);
  if (!res.body || typeof res.body.getReader !== 'function') {
    const buf = Buffer.from(await res.arrayBuffer());
    await new Promise((resolve, reject) => {
      file.end(buf, (err) => (err ? reject(err) : resolve()));
    });
    if (onProgress) onProgress(buf.length, buf.length);
    return;
  }
  const reader = res.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (!file.write(Buffer.from(value))) {
      await new Promise((resolve) => file.once('drain', resolve));
    }
    if (onProgress) onProgress(received, total);
  }
  await new Promise((resolve, reject) => {
    file.end((err) => (err ? reject(err) : resolve()));
  });
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
    const url = `https://github.com/${GH_OWNER}/${GH_REPO}/releases/download/v${version}/${fileName}`;
    const zipPath = path.join(app.getPath('userData'), 'assets', 'tmp', fileName);
    sendSplash({
      state: 'download',
      percent: Math.round((i / needed.length) * 100),
      message: `正在下載${pack.label || pack.id}（${i + 1}/${needed.length}）…`,
      detail: '首次安裝需下載大型動畫資源，之後離線可玩。',
    });
    await downloadToFile(url, zipPath, (received, total) => {
      const packPct = total > 0 ? received / total : 0;
      const percent = ((i + packPct) / needed.length) * 100;
      sendSplash({
        state: 'download',
        percent,
        message: `正在下載${pack.label || pack.id}（${i + 1}/${needed.length}）…`,
        detail: total > 0
          ? `${formatBytes(received)} / ${formatBytes(total)}`
          : formatBytes(received),
      });
    });
    sendSplash({
      state: 'extract',
      percent: ((i + 0.92) / needed.length) * 100,
      message: `正在解壓${pack.label || pack.id}…`,
      detail: '',
    });
    const unpackDir = path.join(destRoot, pack.dest);
    await extractZip(zipPath, unpackDir);
    await fs.promises.writeFile(packMarkerPath(pack), `${assetVer}\n`, 'utf8');
    try { await fs.promises.unlink(zipPath); } catch (_) { /* ignore */ }
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 280,
    frame: false,
    resizable: false,
    show: true,
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
  tray.setToolTip('楓之谷做裝模擬器');
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
      releaseRendererMemory();
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
    sendUpdate({ state: 'checking', message: '正在檢查更新…' });
  });
  autoUpdater.on('update-available', (info) => {
    sendUpdate({
      state: 'available',
      version: info?.version || '',
      message: `發現新版本 ${info?.version || ''}，開始下載…`,
    });
  });
  autoUpdater.on('update-not-available', () => {
    sendUpdate({ state: 'idle', message: '已是最新版本。' });
  });
  autoUpdater.on('download-progress', (progress) => {
    const pct = Number(progress?.percent) || 0;
    sendUpdate({
      state: 'downloading',
      percent: pct,
      message: `正在下載更新 ${pct.toFixed(0)}%`,
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdate({
      state: 'ready',
      version: info?.version || '',
      message: '更新已下載。掛機結束後按「重開並套用更新」。',
    });
  });
  autoUpdater.on('error', (err) => {
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
    await fs.promises.rename(tmp, dest);
    return { ok: true, path: dest };
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
      if (app.isPackaged && missingPacks().length) {
        if (!splashWindow || splashWindow.isDestroyed()) await createSplashWindow();
        sendSplash({
          state: 'download',
          percent: 0,
          message: '正在準備遊戲資源…',
          detail: '',
        });
        await ensureLargeAssets();
      }
      if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
      createTray();
      if (app.isPackaged) {
        setTimeout(() => {
          autoUpdater.checkForUpdates().catch(() => {});
        }, 5000);
      }
    } catch (err) {
      sendSplash({
        state: 'error',
        percent: 0,
        message: `資源準備失敗：${err?.message || err}`,
        detail: '請確認網路後重試。大型動畫包與安裝檔放在同一個 GitHub Release。',
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
    showMainWindow();
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('window-all-closed', () => {
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
