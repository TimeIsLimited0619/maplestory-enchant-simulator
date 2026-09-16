'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mssSplash', {
  onProgress: (cb) => {
    const handler = (_event, data) => {
      try { cb(data); } catch (_) { /* ignore */ }
    };
    ipcRenderer.on('splash:progress', handler);
    return () => ipcRenderer.removeListener('splash:progress', handler);
  },
  pickDir: () => ipcRenderer.invoke('splash:pick-dir'),
  pickSource: () => ipcRenderer.invoke('splash:pick-source'),
  start: () => ipcRenderer.invoke('splash:start'),
  retry: () => ipcRenderer.invoke('splash:retry'),
});
