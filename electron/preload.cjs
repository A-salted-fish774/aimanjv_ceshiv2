const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  createProjectFolder: (name) => ipcRenderer.invoke('create-project-folder', name),
  saveAsset: (p, t, f, d) => ipcRenderer.invoke('save-asset', { projectName: p, type: t, fileName: f, data: d })
});