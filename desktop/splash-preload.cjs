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
  retry: () => ipcRenderer.invoke('splash:retry'),
});
