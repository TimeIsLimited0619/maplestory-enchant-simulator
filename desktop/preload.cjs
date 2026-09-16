'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mssDesktop', {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke('desktop:get-info'),
  setSettings: (patch) => ipcRenderer.invoke('desktop:set-settings', patch),
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-updates'),
  quitAndInstall: () => ipcRenderer.invoke('desktop:quit-and-install'),
  writeSaveBackup: (profile, contents) => ipcRenderer.invoke('desktop:write-save', { profile, contents }),
  onUpdateStatus: (cb) => {
    const handler = (_event, data) => {
      try { cb(data); } catch (_) { /* ignore */ }
    };
    ipcRenderer.on('desktop:update-status', handler);
    return () => ipcRenderer.removeListener('desktop:update-status', handler);
  },
});
