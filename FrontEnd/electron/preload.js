const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: process.versions.electron,
  onUpdateAvailable: (cb) => ipcRenderer.on("update-available", (e, info) => cb(info)),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", (e, info) => cb(info)),
  downloadUpdate: () => ipcRenderer.send("download-update"),
  quitAndInstall: () => ipcRenderer.send("quit-and-install"),
});
