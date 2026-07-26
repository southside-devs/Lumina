const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  version: process.versions.electron,
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", (event, info) => callback(info)),
  onUpdateDownloaded: (callback) => ipcRenderer.on("update-downloaded", (event, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on("download-progress", (event, percent) => callback(percent)),
  downloadUpdate: () => ipcRenderer.send("download-update"),
  quitAndInstall: () => ipcRenderer.send("quit-and-install"),
});
