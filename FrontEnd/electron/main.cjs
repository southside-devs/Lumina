const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let autoUpdater = null;
try { autoUpdater = require("electron-updater").autoUpdater; } catch (e) { console.log("electron-updater unavailable"); }

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, backgroundColor: "#0d1117",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, devTools: isDev
    },
    title: "Lumina Crime Intelligence & Analytical Platform"
  });
  mainWindow.setMenuBarVisibility(false);
  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173").catch(() =>
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html")));
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.webContents.on("did-fail-load", () => {
    setTimeout(() => {
      if (isDev) mainWindow.loadURL("http://localhost:5173").catch(() =>
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html")));
      else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }, 1000);
  });
}

ipcMain.on("download-update", () => { if (autoUpdater && !isDev) autoUpdater.downloadUpdate(); });
ipcMain.on("quit-and-install", () => {
  if (autoUpdater && !isDev) autoUpdater.quitAndInstall();
  else { app.relaunch(); app.exit(0); }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
